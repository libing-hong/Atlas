import type { DiscoveredProgramme, FieldExpansion, UnderstoodProfile } from "./types";
export interface ProgrammeDiscoveryProvider { discover(profile:UnderstoodProfile,terms:FieldExpansion[],limit:number):Promise<DiscoveredProgramme[]> }
const decode=(value:string)=>value.replace(/&amp;/g,"&").replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const officialHost=(url:string)=>{try{const h=new URL(url).hostname;return !/(facebook|linkedin|instagram|youtube|wikipedia|mastersportal|findamasters|studyportals|educations\.com)/i.test(h)}catch{return false}};
const countryHints:Record<string,string>={"法国":"France site:.fr OR site:edu","英国":"United Kingdom site:ac.uk","澳洲":"Australia site:edu.au"};
export class OfficialWebDiscoveryProvider implements ProgrammeDiscoveryProvider {
  async discover(profile:UnderstoodProfile,terms:FieldExpansion[],limit:number){
    const queries=terms.slice(0,8).map(term=>`"${term.term}" master ${profile.targetCountries.map(x=>countryHints[x]??x).join(" ")} official programme`);
    const found:DiscoveredProgramme[]=[];
    for(const query of queries){
      if(process.env.PROGRAMME_SEARCH_API_URL){
        const search=await fetch(process.env.PROGRAMME_SEARCH_API_URL,{method:"POST",headers:{"Content-Type":"application/json",...(process.env.PROGRAMME_SEARCH_API_KEY?{"Authorization":`Bearer ${process.env.PROGRAMME_SEARCH_API_KEY}`}:{})},body:JSON.stringify({query,limit}),cache:"no-store",signal:AbortSignal.timeout(9000)}).catch(()=>null);
        if(search?.ok){const payload=await search.json() as {results?:Array<{title:string;url:string}>};for(const result of payload.results??[]){if(found.length>=limit||!officialHost(result.url))continue;const term=terms.find(x=>result.title.toLowerCase().includes(x.term.toLowerCase()))??terms[0];if(term)found.push({institution:new URL(result.url).hostname.replace(/^www\.|^student\.|^etudiant\./g,"").split(".")[0].toUpperCase(),programme:result.title,officialUrl:result.url,fieldRelation:term.relation,discoveryQuery:query,discoveredAt:new Date().toISOString()})}continue}
      }
      const response=await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,{headers:{"User-Agent":"AtlasProgrammeDiscovery/1.0"},cache:"no-store",signal:AbortSignal.timeout(9000)}).catch(()=>null);
      if(!response?.ok)continue; const html=await response.text();
      const pattern=/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi; let match:RegExpExecArray|null;
      while((match=pattern.exec(html))&&found.length<limit){let url=decode(match[1]);try{const redirect=new URL(url,"https://duckduckgo.com");url=redirect.searchParams.get("uddg")??url}catch{} if(!officialHost(url))continue; const title=decode(match[2]); const term=terms.find(x=>title.toLowerCase().includes(x.term.toLowerCase()))??terms[0]; if(!term)continue; const programme=title.replace(/\s*[|–-]\s*[^|–-]+$/," ").trim(); const institution=new URL(url).hostname.replace(/^www\.|^student\.|^etudiant\./g,"").split(".")[0].replace(/(^|[-_])\w/g,x=>x.replace(/[-_]/," ").toUpperCase()); found.push({institution,programme,officialUrl:url,fieldRelation:term.relation,discoveryQuery:query,discoveredAt:new Date().toISOString()})}
    }
    return found.filter((x,i,a)=>a.findIndex(y=>y.officialUrl===x.officialUrl)===i);
  }
}




