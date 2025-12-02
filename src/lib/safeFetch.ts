const baseFetch = globalThis.fetch?.bind(globalThis);

const isHtmlResponse = (response: Response) => {
  const contentType = response.headers.get('content-type')?.toLowerCase() || '';
  return contentType.includes('text/html');
};

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (!baseFetch) {
    return fetch(input, init);
  }

  const response = await baseFetch(input, init);
  if (isHtmlResponse(response)) {
    const url = response.url || (typeof input === 'string' ? input : input.toString());
    const detailSnippet = await response
      .clone()
      .text()
      .then((text) => text.slice(0, 500))
      .catch(() => '');

    console.error('[NetworkGuard] Resposta HTML inesperada recebida', {
      url,
      status: response.status,
      contentType: response.headers.get('content-type'),
      preview: detailSnippet
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('network:html-response', {
          detail: {
            url,
            status: response.status,
            preview: detailSnippet
          }
        })
      );
    }
  }

  return response;
}
