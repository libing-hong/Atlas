import type { DiscoveredProgramme, SourceEvidence, VerifiedField, VerifiedProgramme, VerificationStatus } from "./types";
const text=(html:string)=>html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&amp;/g," ").replace(/\s+/g," ").trim();
const field=<T>(value:T|null,url:string|null,retrievedAt:string,status:VerificationStatus=value===null?"pending":"verified"):VerifiedField<T>=>({value,sourceUrl:url,retrievedAt,verificationStatus:status});
const first=(body:string,patterns:RegExp[])=>{for(const pattern of patterns){const m=body.match(pattern);if(m?.[1])return m[1].trim()}return null};
export async function verifyOfficialProgramme(item:DiscoveredProgramme):Promise<VerifiedProgramme>{
 const retrievedAt=new Date().toISOString(); const response=await fetch(item.officialUrl,{headers:{"User-Agent":"AtlasOfficialVerifier/1.0"},cache:"no-store",signal:AbortSignal.timeout(10000)}).catch(()=>null);
 if(!response?.ok){const unavailable=<T>()=>field<T>(null,item.officialUrl,retrievedAt,"unavailable");return {...item,active:unavailable(),intake:unavailable(),teachingLanguage:unavailable(),degreeRequirement:unavailable(),subjectRequirement:unavailable(),gradeRequirement:unavailable(),languageRequirement:unavailable(),campus:unavailable(),tuition:unavailable(),tuitionCurrency:unavailable(),deadline:unavailable(),applicationUrl:unavailable()}}
 const html=await response.text(); const body=text(html); const lower=body.toLowerCase();
 const intake=first(body,[/(?:Intake|Rentrée)\s*:?[\s-]*((?:September|January|Septembre|Janvier)\s+20\d{2})/i,/(20\d{2}\s*(?:秋季|春季))/]);
 const fee=first(body,[/(?:€|EUR)\s*([\d,.]{4,})/i,/([\d,.]{4,})\s*(?:€|EUR)/i]);
 const language=first(body,[/(?:Language|Langue)\s*:?[\s-]*(English|French|Anglais|Français)/i]);
 const degree=first(body,[/((?:Bachelor(?:'s)? degree|Bac\s*\+\s*[34]|240 ECTS)[^.]{0,160})/i]);
 const subject=first(body,[/((?:management|arts?|culture|communication|social sciences)[^.]{0,180}(?:related|subjects?|disciplines?|parcours))/i]);
 const grade=first(body,[/((?:minimum|at least|required)[^.]{0,80}(?:GPA|average|grade)[^.]{0,80})/i]);
 const langReq=first(body,[/((?:TOEFL|IELTS|TOEIC|Cambridge|Duolingo|PTE)[^.]{0,240})/i]);
 const campus=first(body,[/(?:Campus|Location|Lieu)\s*:?[\s-]*([A-Za-zÀ-ÿ -]{2,40})/i]);
 const deadline=first(body,[/(?:Deadline|Date limite)\s*:?[\s-]*([^.;]{4,60})/i]);
 const applyMatch=html.match(/<a[^>]+href="([^"]+)"[^>]*>[^<]*(?:Apply|Postuler)[^<]*<\/a>/i); let applicationUrl:string|null=null; if(applyMatch)try{applicationUrl=new URL(applyMatch[1],item.officialUrl).toString()}catch{}
 return {...item,active:field(!/programme (?:closed|discontinued)|formation fermée/i.test(lower),item.officialUrl,retrievedAt),intake:field(intake,item.officialUrl,retrievedAt),teachingLanguage:field(language,item.officialUrl,retrievedAt),degreeRequirement:field(degree,item.officialUrl,retrievedAt),subjectRequirement:field(subject,item.officialUrl,retrievedAt),gradeRequirement:field(grade,item.officialUrl,retrievedAt),languageRequirement:field(langReq,item.officialUrl,retrievedAt),campus:field(campus,item.officialUrl,retrievedAt),tuition:field(fee?Number(fee.replace(/[,\s]/g,"")):null,item.officialUrl,retrievedAt),tuitionCurrency:field(fee?"EUR":null,item.officialUrl,retrievedAt),deadline:field(deadline,item.officialUrl,retrievedAt),applicationUrl:field(applicationUrl,item.officialUrl,retrievedAt)};
}
export function sourcesFor(programme:VerifiedProgramme):SourceEvidence[]{const fields=Object.entries(programme).filter(([,v])=>v&&typeof v==="object"&&"sourceUrl" in v) as Array<[string,VerifiedField<unknown>]>; const grouped=new Map<string,SourceEvidence>();for(const [name,value] of fields){if(!value.sourceUrl)continue;const current=grouped.get(value.sourceUrl)??{sourceUrl:value.sourceUrl,retrievedAt:value.retrievedAt,verificationStatus:value.verificationStatus,fields:[]};current.fields.push(name);if(value.verificationStatus!=="verified")current.verificationStatus="partially_verified";grouped.set(value.sourceUrl,current)}return [...grouped.values()]}


