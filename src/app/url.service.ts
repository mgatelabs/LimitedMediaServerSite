export function extractVQueryArgument(url: string): string {
    const queryParams = new URLSearchParams(url.split('?')[1]);
    return queryParams.get('v') || '';
  }