pub fn normalize_title(value: &str) -> String {
    value.split_whitespace().collect::<Vec<_>>().join(" ")
}

#[cfg(test)]
mod tests {
    use super::normalize_title;

    #[test]
    fn collapses_whitespace() {
        assert_eq!(normalize_title(" repo   racer "), "repo racer");
    }
}
