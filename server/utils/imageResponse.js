function imageResultToContent(response) {
  const item = response?.data?.[0];
  if (!item) {
    throw new Error('Image API returned no results');
  }

  if (item.url) {
    return item.url;
  }

  if (item.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }

  throw new Error('Image API response missing url and b64_json');
}

function buildImageGenerateParams(model, prompt) {
  const params = {
    model,
    prompt,
    n: 1,
    size: '1024x1024',
  };

  if (model.startsWith('gpt-image')) {
    params.quality = 'medium';
  }

  return params;
}

module.exports = {
  imageResultToContent,
  buildImageGenerateParams,
};
