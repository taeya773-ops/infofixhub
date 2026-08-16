import {timingSafeEqual} from "node:crypto";import {env} from "@/lib/env";
function safeEqual(a:string,b:string){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb)}
export function isAdminRequest(request:Request){const auth=request.headers.get("authorization");if(!auth?.startsWith("Basic "))return false;try{const [email,password]=Buffer.from(auth.slice(6),"base64").toString().split(":");return safeEqual(email??"",env.ADMIN_EMAIL)&&safeEqual(password??"",env.ADMIN_PASSWORD)}catch{return false}}
