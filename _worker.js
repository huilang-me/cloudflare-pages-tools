import { getIPInfo } from './modules/ip.js';
import { generateHTML } from './modules/tools.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;
    const path = url.pathname;
    const params = url.searchParams;

    // 条件1: 子域名前缀是 ip.
    const isIPSubdomain = host.startsWith("ip.");

    // 条件2: 路径是 /ip
    const isIPPath = path === "/ip" || path.startsWith("/ip/") || params.has("ip");

    if (isIPSubdomain || isIPPath) {
      return getIPInfo(request);
    }
  
    return new Response(generateHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};
