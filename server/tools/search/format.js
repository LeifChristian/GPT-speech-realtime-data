function formatSerpResults(items) {
  return items
    .slice(0, 10)
    .map(
      (item) =>
        `Name: ${item.title}\nLink: ${item.url}\nSnippet: ${(item.description || '').trim()}\n`
    )
    .join('\n');
}

module.exports = { formatSerpResults };
