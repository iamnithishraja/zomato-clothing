export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // If the path has a file extension (js, css, html, svg, png, etc.), serve the static asset
    if (url.pathname.includes('.')) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.ok) return assetResponse;
    }

    // For all other routes (SPA client-side routes), serve index.html
    return env.ASSETS.fetch(new Request(url.origin + '/index.html', request));
  },
};
