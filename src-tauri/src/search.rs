use serde::Serialize;

const SNIPPET_LEN: usize = 110;
const RESULT_LIMIT: usize = 80;

#[derive(Debug, Clone, Serialize)]
pub struct SearchResult {
    pub name: String,
    pub path: String,
    pub snippet: String,
}

#[derive(Debug, Clone, Default)]
pub struct SearchQuery {
    pub terms: Vec<String>,
    pub tags: Vec<String>,
    pub paths: Vec<String>,
}

impl SearchQuery {
    pub fn from_parts(terms: Vec<String>, tags: Vec<String>, paths: Vec<String>) -> Self {
        Self {
            terms: normalize_list(terms),
            tags: normalize_list(tags)
                .into_iter()
                .map(|tag| tag.trim_start_matches('#').to_string())
                .filter(|tag| !tag.is_empty())
                .collect(),
            paths: normalize_list(paths),
        }
    }

    pub fn is_empty(&self) -> bool {
        self.terms.is_empty() && self.tags.is_empty() && self.paths.is_empty()
    }
}

pub fn search_documents(
    files: &[(String, String, String)],
    query: &SearchQuery,
) -> Vec<SearchResult> {
    if query.is_empty() {
        return Vec::new();
    }

    let mut scored: Vec<(i32, SearchResult)> = Vec::new();

    for (name, path, content) in files {
        if !document_matches(name, path, content, query) {
            continue;
        }
        scored.push((
            match_score(name, content, query),
            SearchResult {
                name: name.clone(),
                path: path.clone(),
                snippet: snippet_for(content, query),
            },
        ));
    }

    scored.sort_by(|a, b| {
        b.0.cmp(&a.0)
            .then_with(|| a.1.name.to_lowercase().cmp(&b.1.name.to_lowercase()))
    });
    scored
        .into_iter()
        .take(RESULT_LIMIT)
        .map(|(_, result)| result)
        .collect()
}

pub fn document_matches(name: &str, path: &str, content: &str, query: &SearchQuery) -> bool {
    let path_norm = normalize_path(path);
    if !query
        .paths
        .iter()
        .all(|fragment| path_norm.contains(fragment))
    {
        return false;
    }

    if !query.tags.is_empty() {
        let file_tags = extract_tags(content);
        if !query
            .tags
            .iter()
            .all(|wanted| tag_matches(&file_tags, wanted))
        {
            return false;
        }
    }

    if query.terms.is_empty() {
        return true;
    }

    let name_l = name.to_lowercase();
    let content_l = content.to_lowercase();
    query
        .terms
        .iter()
        .all(|term| name_l.contains(term) || content_l.contains(term))
}

pub fn extract_tags(content: &str) -> Vec<String> {
    let mut tags: Vec<String> = Vec::new();
    if let Some(block) = frontmatter_block(content) {
        tags.extend(frontmatter_tags(block));
    }
    tags.extend(hashtag_tags(body_after_frontmatter(content)));
    tags.sort();
    tags.dedup();
    tags
}

fn match_score(name: &str, content: &str, query: &SearchQuery) -> i32 {
    if query.terms.is_empty() {
        return 0;
    }
    let name_l = name.to_lowercase();
    let content_l = content.to_lowercase();
    let mut score = 0;
    if query.terms.iter().any(|term| name_l.contains(term)) {
        score += 2;
    }
    if query.terms.iter().any(|term| content_l.contains(term)) {
        score += 1;
    }
    score
}

fn tag_matches(file_tags: &[String], wanted: &str) -> bool {
    file_tags
        .iter()
        .any(|tag| tag == wanted || tag.starts_with(&format!("{wanted}/")))
}

fn snippet_for(content: &str, query: &SearchQuery) -> String {
    let mut needles = query.terms.clone();
    needles.extend(query.tags.iter().map(|tag| format!("#{tag}")));
    needles.extend(query.tags.clone());

    if let Some((start, end)) = first_match(content, &needles) {
        return window_around(content, start, end);
    }

    squash_whitespace(
        &body_after_frontmatter(content)
            .lines()
            .map(str::trim)
            .find(|line| !line.is_empty() && *line != "---")
            .unwrap_or(""),
    )
    .chars()
    .take(SNIPPET_LEN)
    .collect()
}

fn first_match(content: &str, needles: &[String]) -> Option<(usize, usize)> {
    let haystack = content.to_lowercase();
    let mut best: Option<(usize, usize)> = None;
    for needle in needles {
        if needle.is_empty() {
            continue;
        }
        if let Some(start) = haystack.find(needle) {
            let end = start + needle.len();
            let better = match best {
                None => true,
                Some((best_start, best_end)) => {
                    start < best_start || (start == best_start && end > best_end)
                }
            };
            if better {
                best = Some((start, end));
            }
        }
    }
    best.filter(|(start, end)| content.is_char_boundary(*start) && content.is_char_boundary(*end))
}

fn window_around(content: &str, start: usize, end: usize) -> String {
    let prefix: String = content[..start]
        .chars()
        .rev()
        .take(36)
        .collect::<String>()
        .chars()
        .rev()
        .collect();
    let matched = &content[start..end];
    let suffix: String = content[end..].chars().take(SNIPPET_LEN.saturating_sub(
        prefix.chars().count() + matched.chars().count(),
    ))
    .collect();

    let mut snippet = String::new();
    if !prefix.is_empty() && start > 0 {
        snippet.push('…');
    }
    snippet.push_str(&squash_whitespace(&format!("{prefix}{matched}{suffix}")));
    if end < content.len() && snippet.chars().count() >= 8 {
        let remaining = content[end..].chars().count();
        if remaining > suffix.chars().count() {
            snippet.push('…');
        }
    }
    snippet.chars().take(SNIPPET_LEN + 2).collect()
}

fn squash_whitespace(input: &str) -> String {
    let mut out = String::new();
    let mut prev_space = false;
    for ch in input.chars() {
        if ch.is_whitespace() {
            if !prev_space && !out.is_empty() {
                out.push(' ');
            }
            prev_space = true;
        } else {
            out.push(ch);
            prev_space = false;
        }
    }
    out.trim().to_string()
}

fn frontmatter_block(content: &str) -> Option<&str> {
    let content = content.strip_prefix('\u{feff}').unwrap_or(content);
    let rest = content
        .strip_prefix("---\n")
        .or_else(|| content.strip_prefix("---\r\n"))?;
    let close = rest.find("\n---")?;
    Some(&rest[..close])
}

fn body_after_frontmatter(content: &str) -> &str {
    let content = content.strip_prefix('\u{feff}').unwrap_or(content);
    if let Some(block) = frontmatter_block(content) {
        let marker_len = if content.starts_with("---\r\n") { 5 } else { 4 };
        let after = marker_len + block.len();
        let tail = &content[after..];
        return tail
            .strip_prefix("\n---")
            .or_else(|| tail.strip_prefix("\r\n---"))
            .unwrap_or(tail)
            .trim_start_matches(['\r', '\n']);
    }
    content
}

fn frontmatter_tags(block: &str) -> Vec<String> {
    let mut tags = Vec::new();
    let lines: Vec<&str> = block.lines().collect();
    let mut index = 0;
    while index < lines.len() {
        let trimmed = lines[index].trim();
        let Some((key, rest)) = split_yaml_key(trimmed) else {
            index += 1;
            continue;
        };
        if key != "tag" && key != "tags" {
            index += 1;
            continue;
        }

        let value = rest.trim();
        if value.is_empty() {
            index += 1;
            while index < lines.len() {
                let item = lines[index];
                if let Some(stripped) = item.trim().strip_prefix("- ") {
                    tags.extend(split_tag_values(stripped));
                    index += 1;
                    continue;
                }
                if item.starts_with(' ') || item.starts_with('\t') {
                    index += 1;
                    continue;
                }
                break;
            }
            continue;
        }

        tags.extend(split_tag_values(value));
        index += 1;
    }
    tags
}

fn split_yaml_key(line: &str) -> Option<(String, &str)> {
    let (key, rest) = line.split_once(':')?;
    let key = key.trim().to_lowercase();
    if key.is_empty() {
        return None;
    }
    Some((key, rest))
}

fn split_tag_values(value: &str) -> Vec<String> {
    let trimmed = value.trim().trim_matches(['[', ']']);
    trimmed
        .split(',')
        .map(|part| unwrap_quotes(part.trim()).to_lowercase())
        .filter(|part| !part.is_empty())
        .map(|part| part.trim_start_matches('#').to_string())
        .collect()
}

fn unwrap_quotes(value: &str) -> &str {
    if value.len() >= 2 {
        let bytes = value.as_bytes();
        if (bytes[0] == b'"' && bytes[value.len() - 1] == b'"')
            || (bytes[0] == b'\'' && bytes[value.len() - 1] == b'\'')
        {
            return &value[1..value.len() - 1];
        }
    }
    value
}

fn hashtag_tags(content: &str) -> Vec<String> {
    let mut tags = Vec::new();
    let mut in_fence = false;
    for line in content.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence {
            continue;
        }
        tags.extend(hashtags_in_line(line));
    }
    tags
}

fn hashtags_in_line(line: &str) -> Vec<String> {
    let mut tags = Vec::new();
    let chars: Vec<char> = line.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] != '#' {
            i += 1;
            continue;
        }
        let prev_ok = i == 0 || !is_tag_char(chars[i - 1]);
        let next = chars.get(i + 1).copied();
        let next_is_tag = next.map(is_tag_char).unwrap_or(false);
        if !prev_ok || next == Some('#') || !next_is_tag {
            i += 1;
            continue;
        }
        i += 1;
        let start = i;
        while i < chars.len() && is_tag_char(chars[i]) {
            i += 1;
        }
        let tag: String = chars[start..i].iter().collect::<String>().to_lowercase();
        if !tag.is_empty() {
            tags.push(tag);
        }
    }
    tags
}

fn is_tag_char(ch: char) -> bool {
    ch.is_alphanumeric() || ch == '_' || ch == '-' || ch == '/'
}

fn normalize_list(values: Vec<String>) -> Vec<String> {
    values
        .into_iter()
        .map(|value| value.trim().to_lowercase())
        .filter(|value| !value.is_empty())
        .collect()
}

fn normalize_path(path: &str) -> String {
    path.replace('\\', "/").to_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn query(terms: &[&str], tags: &[&str], paths: &[&str]) -> SearchQuery {
        SearchQuery::from_parts(
            terms.iter().map(|s| s.to_string()).collect(),
            tags.iter().map(|s| s.to_string()).collect(),
            paths.iter().map(|s| s.to_string()).collect(),
        )
    }

    #[test]
    fn matches_filename_without_body_hit() {
        assert!(document_matches(
            "welcome.md",
            "/Demo/welcome.md",
            "nothing here",
            &query(&["welcome"], &[], &[]),
        ));
    }

    #[test]
    fn terms_are_and() {
        let content = "agenda for the weekly meeting";
        assert!(document_matches(
            "note.md",
            "/n/note.md",
            content,
            &query(&["agenda", "meeting"], &[], &[]),
        ));
        assert!(!document_matches(
            "note.md",
            "/n/note.md",
            content,
            &query(&["agenda", "missing"], &[], &[]),
        ));
    }

    #[test]
    fn hashtag_is_a_tag_heading_is_not() {
        let content = "# Daily notes\n\nRemember #会议 and #work/project\n";
        let tags = extract_tags(content);
        assert!(tags.contains(&"会议".to_string()));
        assert!(tags.contains(&"work/project".to_string()));
        assert!(!tags.iter().any(|tag| tag.contains("daily")));
    }

    #[test]
    fn frontmatter_list_and_inline_tags() {
        let content = "---\ntags:\n  - work\n  - personal\ntag: inbox\n---\n\nBody\n";
        let tags = extract_tags(content);
        assert!(tags.contains(&"work".to_string()));
        assert!(tags.contains(&"personal".to_string()));
        assert!(tags.contains(&"inbox".to_string()));
    }

    #[test]
    fn nested_tag_filter_matches_children_not_prefix_words() {
        let content = "Talk about #work/project today";
        assert!(document_matches(
            "a.md",
            "/a.md",
            content,
            &query(&[], &["work"], &[]),
        ));
        assert!(!document_matches(
            "a.md",
            "/a.md",
            "Talk about #workshop",
            &query(&[], &["work"], &[]),
        ));
    }

    #[test]
    fn path_filter_is_substring() {
        assert!(document_matches(
            "a.md",
            "/Demo/notes/a.md",
            "hi",
            &query(&[], &[], &["notes"]),
        ));
        assert!(!document_matches(
            "a.md",
            "/Demo/journal/a.md",
            "hi",
            &query(&[], &[], &["notes"]),
        ));
    }

    #[test]
    fn snippet_centers_on_the_first_term() {
        let content = "alpha beta gamma delta epsilon zeta eta theta iota meeting kappa";
        let snippet = snippet_for(content, &query(&["meeting"], &[], &[]));
        assert!(snippet.to_lowercase().contains("meeting"));
        assert!(snippet.contains('…'));
    }

    #[test]
    fn search_documents_orders_filename_hits_first() {
        let files = vec![
            (
                "other.md".into(),
                "/other.md".into(),
                "welcome in the body".into(),
            ),
            (
                "welcome.md".into(),
                "/welcome.md".into(),
                "no match in body".into(),
            ),
        ];
        let results = search_documents(&files, &query(&["welcome"], &[], &[]));
        assert_eq!(results[0].name, "welcome.md");
        assert_eq!(results.len(), 2);
    }
}
