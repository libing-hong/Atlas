"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, FileCheck2, FileText, GraduationCap, Landmark,
  RefreshCw, ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import {
  getApplicationStateSnapshot,
  getServerApplicationStateSnapshot,
  subscribeToApplicationState,
} from "@/lib/application-store";
import type { ApplicationRecord } from "@/lib/application-prototype-data";
import { VISA_POLICIES, normalizeVisaCountry, type VisaPolicy } from "@/lib/visa-policies";
import {
  confirmAcceptedOffer,
  getServerVisaSelectionSnapshot,
  getVisaSelectionSnapshot,
  subscribeToVisaSelection,
  type AcceptedVisaOffer,
} from "@/lib/visa-store";
import {
  UK_STUDENT_VISA_RULES,
  calculateRequiredFunds,
  type VisaLocation,
} from "@/lib/visa-rules";

type ApplicationSnapshot = {
  records: ApplicationRecord[];
};

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export default function VisaWorkspacePage() {
  const applicationSnapshot = useSyncExternalStore(
    subscribeToApplicationState,
    getApplicationStateSnapshot,
    getServerApplicationStateSnapshot,
  );
  const selectionSnapshot = useSyncExternalStore(
    subscribeToVisaSelection,
    getVisaSelectionSnapshot,
    getServerVisaSelectionSnapshot,
  );

  const applications: ApplicationSnapshot = applicationSnapshot === "server"
    ? { records: [] }
    : JSON.parse(applicationSnapshot) as ApplicationSnapshot;
  const visaSelection = selectionSnapshot === "server"
    ? { current: null as AcceptedVisaOffer | null, archived: [] as AcceptedVisaOffer[] }
    : JSON.parse(selectionSnapshot) as { current: AcceptedVisaOffer | null; archived: AcceptedVisaOffer[] };

  const offers = applications.records.filter((record) => record.status === "offer_received");
  const acceptedOffer = visaSelection.current;
  const countryCode = acceptedOffer ? normalizeVisaCountry(acceptedOffer.country) : null;
  const policy = countryCode ? VISA_POLICIES[countryCode] : null;

  if (!acceptedOffer) {
    return <VisaEntryState offers={offers} />;
  }

  if (!policy) {
    return <UnsupportedCountryState offer={acceptedOffer} offers={offers} />;
  }

  return (
    <VisaWorkspace
      policy={policy}
      acceptedOffer={acceptedOffer}
      offers={offers}
      previousOffer={visaSelection.archived[0] ?? null}
    />
  );
}

function VisaEntryState({ offers }: { offers: ApplicationRecord[] }) {
  const hasOffers = offers.length > 0;

  return (
    <DashboardShell>
      <header className="mb-6">
        <Link href="/dashboard" className="text-sm text-[#7f7368] hover:text-[#2f2924]">
          我的 Atlas / 签证准备
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">VISA WORKSPACE</p>
        <h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924] md:text-6xl">签证准备</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f6256]">
          {hasOffers
            ? "你已经获得录取。请先确认最终入读学校，Atlas 才会生成对应国家的签证计划。"
            : "确认最终入读学校后，Atlas 将自动生成对应国家的签证计划。"}
        </p>
      </header>

      {hasOffers ? (
        <section>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">YOUR OFFERS</p>
            <h2 className="mt-2 font-editorial text-4xl font-semibold">选择最终入读学校</h2>
            <p className="mt-2 text-sm leading-6 text-[#7f7368]">
              Atlas 不会根据某一份 Offer 自动猜测你的目的地。只有你明确确认后，签证流程才会开始。
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <Card key={offer.id} className="flex flex-col p-5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f4ede4] text-[#6f6256]">
                  <GraduationCap size={20} />
                </span>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">{offer.country}</p>
                <h3 className="mt-2 text-lg font-semibold text-[#2f2924]">{offer.universityName}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#6f6256]">{offer.programName}</p>
                <button
                  onClick={() => confirmAcceptedOffer({
                    applicationId: offer.id,
                    universityName: offer.universityName,
                    programName: offer.programName,
                    country: offer.country,
                  })}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-[#fffaf3]"
                >
                  确认入读这所学校 <ArrowRight size={15} />
                </button>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <Card className="mt-8 p-6 md:p-9">
          <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f4ede4] text-[#8a7969]">
              <Clock3 size={24} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">等待录取</p>
              <h2 className="mt-2 font-editorial text-3xl font-semibold">当前尚未获得录取</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f6256]">
                Atlas 会在你获得录取并确认最终入读学校后生成签证计划。现在不会加载任何国家的详细要求。
              </p>
            </div>
            <Link href="/dashboard/applications" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8ccbe] px-5 py-3 text-sm font-medium text-[#4a3d34]">
              查看我的申请 <ArrowRight size={15} />
            </Link>
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}

function UnsupportedCountryState({ offer, offers }: { offer: AcceptedVisaOffer; offers: ApplicationRecord[] }) {
  return (
    <DashboardShell>
      <Link href="/dashboard" className="text-sm text-[#7f7368]">我的 Atlas / 签证准备</Link>
      <Card className="mt-8 p-7">
        <p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">POLICY COMING SOON</p>
        <h1 className="mt-3 font-editorial text-5xl font-semibold">签证准备</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6256]">
          你已确认入读 {offer.universityName}（{offer.country}）。该国家的签证政策包尚未启用，Atlas 已保留你的选择。
        </p>
        {offers.length ? <OfferSwitcher offers={offers} /> : null}
      </Card>
    </DashboardShell>
  );
}

function VisaWorkspace({
  policy,
  acceptedOffer,
  offers,
  previousOffer,
}: {
  policy: VisaPolicy;
  acceptedOffer: AcceptedVisaOffer;
  offers: ApplicationRecord[];
  previousOffer: AcceptedVisaOffer | null;
}) {
  const [showOffers, setShowOffers] = useState(false);
  const [tuition, setTuition] = useState(25000);
  const [paid, setPaid] = useState(5000);
  const [location, setLocation] = useState<VisaLocation>("london");
  const required = useMemo(
    () => calculateRequiredFunds(tuition, paid, location),
    [tuition, paid, location],
  );
  const living = UK_STUDENT_VISA_RULES.maintenance[location];
  const isGB = policy.countryCode === "GB";

  return (
    <DashboardShell>
      {previousOffer && previousOffer.country !== acceptedOffer.country ? (
        <div className="mb-5 rounded-[20px] border border-[#d6dfd2] bg-[#eef3eb] p-4 text-sm leading-6 text-[#52614f]">
          你的最终入读国家已从 {previousOffer.country} 变更为 {acceptedOffer.country}。Atlas 已重新生成签证计划，并保留可复用材料与旧计划记录。
        </div>
      ) : null}

      <header className="mb-6">
        <Link href="/dashboard" className="text-sm text-[#7f7368] hover:text-[#2f2924]">
          我的 Atlas / 签证准备
        </Link>
        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">{policy.eyebrow}</p>
            <h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924] md:text-6xl">
              {policy.countryName}学生签证准备
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6256]">
              只看当前最重要的节点、费用和材料。规则最后核验于 {policy.lastVerifiedAt}。
            </p>
            <p className="mt-2 text-sm text-[#8f847a]">
              {acceptedOffer.universityName} · {acceptedOffer.programName}
            </p>
          </div>
          <button
            onClick={() => setShowOffers((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8ccbe] px-5 py-3 text-sm font-medium text-[#4a3d34]"
          >
            <RefreshCw size={15} /> 更改最终学校
          </button>
        </div>
      </header>

      {showOffers && offers.length ? <OfferSwitcher offers={offers} /> : null}

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Summary icon={FileCheck2} label="当前阶段" value={policy.currentStage} note={policy.visaType} />
        <Summary icon={ArrowRight} label="下一步" value={policy.nextStep} note="根据当前状态生成" />
        <Summary icon={CalendarDays} label={policy.submissionLabel} value={policy.submissionTiming} note="最终以官方规则为准" />
        <Summary icon={CircleDollarSign} label="预计费用与资金" value={isGB ? money.format(required) : "动态计算"} note={policy.costSummary} />
      </section>

      <Card className="mb-6 border-2 border-[#2f2924] p-5 md:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">现在只做这一件事</p>
            <h2 className="mt-2 font-editorial text-3xl font-semibold">{policy.nextStep}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6f6256]">
              任务由最终入读国家与个人情况共同决定，不会仅凭学校所在国家展示全部材料。
            </p>
          </div>
          <span className="rounded-full bg-[#f2dfc1] px-3 py-1.5 text-xs font-medium text-[#6b542c]">需要处理</span>
        </div>
      </Card>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
        <Card className="p-5 md:p-7">
          <SectionTitle eyebrow="Timeline" title="办理时间线" subtitle="国家政策包提供主流程，个人资料决定具体分支。" />
          <div className="mt-6">
            {policy.stages.map((stage, index) => (
              <div key={stage.id} className="grid grid-cols-[34px_1fr] gap-4">
                <div className="flex flex-col items-center">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${index === 0 ? "bg-[#2f2924] text-white" : "border border-[#d8ccbe] bg-[#fffaf3] text-[#7f7368]"}`}>
                    {index === 0 ? <Check size={15} /> : index + 1}
                  </span>
                  {index < policy.stages.length - 1 ? <span className="min-h-14 w-px flex-1 bg-[#e8dfd3]" /> : null}
                </div>
                <div className="pb-6">
                  <h3 className="font-semibold text-[#2f2924]">{stage.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#8a7252]"><Clock3 size={13} />{stage.timing}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6f6256]">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <SectionTitle eyebrow="Costs & funds" title="费用与资金" subtitle="根据国家政策及学校、课程和个人情况计算。" />
          {isGB ? (
            <>
              <div className="mt-6 space-y-4">
                <MoneyInput label="第一学年学费" value={tuition} onChange={setTuition} />
                <MoneyInput label="已确认支付的学费" value={paid} onChange={setPaid} />
                <label className="block">
                  <span className="text-sm font-medium text-[#4a3d34]">学校所在地</span>
                  <select value={location} onChange={(event) => setLocation(event.target.value as VisaLocation)} className="quiet-input mt-2 rounded-2xl">
                    <option value="london">伦敦地区</option>
                    <option value="outsideLondon">非伦敦地区</option>
                  </select>
                </label>
              </div>
              <div className="mt-6 rounded-[22px] bg-[#2f2924] p-5 text-[#fffaf3]">
                <p className="text-xs uppercase tracking-[0.22em] text-[#d9cfc4]">最低资金要求</p>
                <p className="mt-2 font-editorial text-5xl font-semibold">{money.format(required)}</p>
                <div className="mt-4 space-y-2 border-t border-white/15 pt-4 text-sm text-[#eee5dc]">
                  <Line label="剩余学费" value={money.format(Math.max(0, tuition - paid))} />
                  <Line label={`生活费（${living.months} 个月）`} value={money.format(living.monthly * living.months)} />
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-[22px] bg-[#f7f0e8] p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">{policy.costLabel}</p>
              <p className="mt-3 font-editorial text-3xl font-semibold">等待课程与个人资料</p>
              <p className="mt-3 text-sm leading-6 text-[#6f6256]">{policy.costSummary}。Atlas 不会套用英国的 CAS、28 天资金或 IHS 字段。</p>
            </div>
          )}
          <ContextChecklist />
        </Card>
      </section>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
        <Card className="p-5 md:p-7">
          <SectionTitle eyebrow="Documents" title="材料清单" subtitle="只展示当前国家和个人情况适用的材料。" />
          <div className="mt-5 divide-y divide-[#e8dfd3]">
            {policy.documents.map((item) => (
              <div key={item.name} className="flex items-center gap-4 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f4ede4] text-[#6f6256]"><FileText size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#2f2924]">{item.name}</p>
                  <p className="mt-1 text-sm text-[#7f7368]">{item.note}</p>
                  {item.conditional ? <p className="mt-1 text-xs text-[#9a7652]">{item.conditional}</p> : null}
                </div>
                <ChevronRight size={16} className="shrink-0 text-[#a79a8d]" />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 md:p-7">
            <SectionTitle eyebrow="Final check" title="递交前检查" subtitle="阻塞项清零后再进入在线申请。" />
            <div className="mt-5 space-y-3">
              {policy.blockers.map((label, index) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl bg-[#f7f0e8] p-3.5 text-sm">
                  {index === 0 ? <AlertTriangle size={17} className="text-[#a07152]" /> : <CheckCircle2 size={17} className="text-[#b7aca1]" />}
                  <span className="flex-1 text-[#4a3d34]">{label}</span>
                  <span className="text-xs text-[#8f847a]">{index === 0 ? "阻塞" : "待检查"}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-[#e2c7bb] bg-[#f7ebe5] p-5 md:p-7">
            <div className="flex items-center gap-3"><ShieldAlert className="text-[#8a5f54]" /><h2 className="font-editorial text-3xl font-semibold">重点风险</h2></div>
            <div className="mt-5 space-y-4">
              {policy.risks.map((risk) => <div key={risk.title}><p className="text-sm font-semibold text-[#5f4037]">{risk.title}</p><p className="mt-1 text-sm leading-6 text-[#7f594d]">{risk.detail}</p></div>)}
            </div>
          </Card>
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-4 border-t border-[#e8dfd3] py-5 text-xs text-[#8f847a] sm:flex-row">
        <span>政策包：{policy.countryCode} · 最后核验 {policy.lastVerifiedAt}</span>
        <div className="flex flex-wrap gap-3">
          {policy.officialSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{source.label}</a>)}
        </div>
      </footer>
    </DashboardShell>
  );
}

function OfferSwitcher({ offers }: { offers: ApplicationRecord[] }) {
  return (
    <div className="mb-6 grid gap-3 rounded-[22px] bg-[#f4ede4] p-4 md:grid-cols-2 xl:grid-cols-3">
      {offers.map((offer) => (
        <button
          key={offer.id}
          onClick={() => confirmAcceptedOffer({
            applicationId: offer.id,
            universityName: offer.universityName,
            programName: offer.programName,
            country: offer.country,
          })}
          className="rounded-2xl bg-[#fffaf3] p-4 text-left transition hover:-translate-y-0.5"
        >
          <p className="text-xs text-[#9a8b7c]">{offer.country}</p>
          <p className="mt-1 font-semibold text-[#2f2924]">{offer.universityName}</p>
          <p className="mt-1 text-xs text-[#7f7368]">{offer.programName}</p>
        </button>
      ))}
    </div>
  );
}

function ContextChecklist() {
  const fields = ["国籍与当前居住国", "申请递交国家", "课程级别、日期与时长", "年龄与家属", "奖学金与已付学费", "特殊审批要求"];
  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">个性化判断所需资料</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {fields.map((field) => <div key={field} className="flex items-center gap-2 text-xs text-[#6f6256]"><span className="h-1.5 w-1.5 rounded-full bg-[#8ea08b]" />{field}</div>)}
      </div>
    </div>
  );
}

function Summary({ icon: Icon, label, value, note }: { icon: React.ElementType; label: string; value: string; note: string }) {
  return <Card className="p-5"><Icon size={19} className="text-[#8ea08b]" /><p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="mt-2 text-xs text-[#7f7368]">{note}</p></Card>;
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div><p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">{eyebrow}</p><h2 className="mt-2 font-editorial text-4xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#7f7368]">{subtitle}</p></div>;
}

function MoneyInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block"><span className="text-sm font-medium text-[#4a3d34]">{label}</span><div className="quiet-input mt-2 flex items-center gap-2 rounded-2xl"><Landmark size={17} className="text-[#9a8b7c]" /><span className="text-[#9a8b7c]">£</span><input type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="min-w-0 flex-1 bg-transparent outline-none" /></div></label>;
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span>{label}</span><span>{value}</span></div>;
}
