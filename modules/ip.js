export async function getIPInfo(request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const cf = request.cf || {};

  // 1️⃣ 优先使用 ?ip=xxx 查询
  let queryIP = params.get("ip");

  // 2️⃣ 如果 query 没有，再尝试从路径 /ip/xxx 获取
  if (!queryIP) {
    const match = url.pathname.match(/^\/ip\/(.+)$/);
    if (match) queryIP = match[1];
  }

  // 3️⃣ 如果还是没有，并且 host 以 ip. 开头，尝试取路径第一级作为 IP
  if (!queryIP && url.hostname.startsWith("ip.")) {
    const pathMatch = url.pathname.match(/^\/([^\/]+)(\/.*)?$/);
    if (pathMatch) queryIP = pathMatch[1];
  }

  // 简单 IPv4 和 IPv6 校验正则
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;

  // 4️⃣ 如果没有指定 IP 或者ip格式不对 → 使用访问者 IP + CF 信息
  if (!queryIP) {
    const ip = request.headers.get("cf-connecting-ip");
    const data = {
      ip,
      asn: cf.asn || null,
      org: cf.asOrganization || null,
      country: cf.country || null,
      region: cf.region || null,
      city: cf.city || null,
      tz: cf.timezone || null
    };
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*"
      }
    });
  } else if (!ipv4Regex.test(queryIP) && !ipv6Regex.test(queryIP)) {
    return new Response(JSON.stringify({
      error: "无效的 IP 地址",
      ip: queryIP
    }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*"
      }
    });
  }

  // 4️⃣ 如果指定了 IP → 调用第三方 API 获取信息
  try {
    // const res = await fetch(`https://ipwhois.app/json/${queryIP}`);
    const res = await fetch(`https://api.ip.sb/geoip/${queryIP}`);
    const data = await res.json();
    if (data.ip) {
      // 只返回需要的字段
      const filtered = {
        ip: data.ip,
        asn: data.asn,
        // isp: data.isp,
        org: data.org || data.organization,
        country: data.country_code,
        region: data.region,
        city: data.city,
        tz: data.timezone
      };
      return new Response(JSON.stringify(filtered, null, 2), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      });
    } else {
      // success 为 false 时返回完整的错误信息
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message || "调用第三方 API 失败",
      ip: queryIP
    }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*"
      }
    });
  }
}
