const ENDPOINT='https://mcp.mcd.cn';
const ALLOWED=new Set(['list-nutrition-foods','now-time-info']);
export class McdClient {
 constructor(token,transport=fetch){if(!token)throw Error('请在本机环境设置 MCD_MCP_TOKEN');this.token=token;this.transport=transport;this.id=0;this.session=null;this.version='2024-11-05';}
 async request(method,params,notification=false){
  const headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream','Authorization':`Bearer ${this.token}`,'MCP-Protocol-Version':this.version};if(this.session)headers['Mcp-Session-Id']=this.session;
  const body={jsonrpc:'2.0',method,...(params?{params}:{}),...(!notification?{id:++this.id}:{})};
  let res;try{res=await this.transport(ENDPOINT,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(30000),redirect:'error'});}catch{throw Error('官方 MCP 连接超时或网络不可达；未改用模拟数据');}
  if(!res.ok){throw Error(`官方 MCP 返回 HTTP ${res.status}；请检查本机凭据或稍后再试`);}
  const sid=res.headers.get('mcp-session-id');if(sid)this.session=sid;
  if(notification||res.status===202)return null;
  const text=await res.text();let msg;
  try{if(res.headers.get('content-type')?.includes('text/event-stream')){const chunks=text.split(/\r?\n\r?\n/).map(b=>b.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n')).filter(Boolean).map(s=>JSON.parse(s));msg=chunks.find(x=>x.id===body.id);}else msg=JSON.parse(text);}catch{throw Error('官方 MCP 响应不是可识别的 JSON/SSE');}
  if(!msg)throw Error('官方 MCP 未返回本次请求的结果');if(msg.error)throw Error(`MCP 协议错误 ${msg.error.code}；未保存服务端正文`);return msg.result;
 }
 async init(){const result=await this.request('initialize',{protocolVersion:this.version,capabilities:{},clientInfo:{name:'mcd-mystery',version:'1.0.0'}});this.version=result.protocolVersion||this.version;await this.request('notifications/initialized',undefined,true);return result;}
 async list(){let tools=[],cursor;do{const r=await this.request('tools/list',cursor?{cursor}:{});tools.push(...r.tools);cursor=r.nextCursor;}while(cursor);return tools.filter(t=>ALLOWED.has(t.name));}
 async call(name,args={}){if(!ALLOWED.has(name))throw Error('只读白名单拒绝此工具');const r=await this.request('tools/call',{name,arguments:args});if(r?.isError)throw Error('官方工具返回业务错误；未改用演示结果');return r;}
}
