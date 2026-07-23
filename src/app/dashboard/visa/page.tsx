"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, FileCheck2, FileText, Landmark, ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { UK_STUDENT_VISA_RULES, calculateRequiredFunds, type VisaLocation } from "@/lib/visa-rules";

const timeline = [
  { title: "满足录取条件", timing: "收到录取后立即", detail: "满足语言、学历和成绩条件，支付押金并等待无条件录取。", status: "已完成" },
  { title: "准备签证资金", timing: "递签前至少 28 天", detail: "资金需覆盖第一学年剩余学费与最多 9 个月生活费。", status: "进行中" },
  { title: "确认 TB 与 ATAS", timing: "递签前完成", detail: "按近期居住记录判断 TB；按 Offer、CAS 或 CAH3 code 确认 ATAS。", status: "需要处理" },
  { title: "获得并核对 CAS", timing: "递签前必须取得", detail: "核对身份、课程日期、学费、已付款和 ATAS 等信息。", status: "等待中" },
  { title: "在线递交签证", timing: "最早开课前 6 个月", detail: "填写申请、支付签证费与 IHS、上传材料并完成身份验证。", status: "未开始" },
  { title: "等待结果并设置 eVisa", timing: "通常约 3 周", detail: "获批后登录 UKVI Account，关联入境护照并检查签证信息。", status: "未开始" },
];

const materials = [
  { name: "有效护照", note: "姓名与护照号须和 CAS 一致", state: "已准备", required: true },
  { name: "CAS", note: "Reference number 与全部信息已核对", state: "等待中", required: true },
  { name: "资金证明", note: "完整 28 天记录，材料日期在递签前 31 天内", state: "准备中", required: false },
  { name: "TB 检测证明", note: "仅使用英国内政部指定诊所", state: "待判断", required: false },
  { name: "ATAS 证书", note: "适用课程必须在递签前取得", state: "待判断", required: false },
  { name: "学历、语言与翻译", note: "按 CAS 和个人情况准备备用", state: "未开始", required: false },
];

const risks = [
  ["资金未满 28 天", "期间任意一天余额不足，都可能需要重新计算。"],
  ["CAS 信息不一致", "姓名、护照、课程日期或学费有误时，先联系学校修改。"],
  ["TB 诊所不合规", "非指定诊所出具的证明可能不被接受。"],
  ["遗漏 ATAS", "课程需要 ATAS 时，取得证书前不能递交。"],
];

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export default function VisaPage() {
  const [tuition, setTuition] = useState(25000);
  const [paid, setPaid] = useState(5000);
  const [location, setLocation] = useState<VisaLocation>("london");
  const required = useMemo(() => calculateRequiredFunds(tuition, paid, location), [tuition, paid, location]);
  const living = UK_STUDENT_VISA_RULES.maintenance[location];
  const progress = 32;

  return (
    <DashboardShell>
      <header className="mb-6">
        <Link href="/dashboard" className="text-sm text-[#7f7368] hover:text-[#2f2924]">我的 Atlas / 签证准备</Link>
        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">UK Student Visa</p>
            <h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924] md:text-6xl">英国学生签证准备</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6256]">只看现在最重要的节点、资金和材料。规则最后核验于 {UK_STUDENT_VISA_RULES.verifiedAt}。</p>
          </div>
          <Link href="#final-check" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-6 py-3.5 text-sm font-medium text-[#fffaf3]">
            查看缺少的材料 <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Summary icon={FileCheck2} label="当前阶段" value="准备签证资金" note="已完成 2 / 6 个节点" />
        <Summary icon={ArrowRight} label="下一步" value="确认 TB 与 ATAS" note="建议本周完成判断" />
        <Summary icon={CalendarDays} label="最早递交" value="开课前 6 个月" note="资金 28 天满足后再递交" />
        <Summary icon={CircleDollarSign} label="预计资金" value={money.format(required)} note="含剩余学费与生活费" />
      </section>

      <Card className="mb-6 border-2 border-[#2f2924] p-5 md:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">现在只做这一件事</p>
            <h2 className="mt-2 font-editorial text-3xl font-semibold">让签证资金连续满足 28 天</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6f6256]">期间余额不能低于要求；银行材料的截止日期须在网上递交前 31 天以内。</p>
          </div>
          <span className="rounded-full bg-[#f2dfc1] px-3 py-1.5 text-xs font-medium text-[#6b542c]">进行中</span>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e8dfd3]"><div className="h-full rounded-full bg-[#8ea08b]" style={{ width: `${progress}%` }} /></div>
        <div className="mt-3 flex justify-between text-xs text-[#8f847a]"><span>已持有 9 天</span><span>还需 19 天</span></div>
      </Card>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
        <Card className="p-5 md:p-7">
          <SectionTitle eyebrow="Timeline" title="办理时间线" subtitle="每一步只显示完成条件和最晚节点。" />
          <div className="mt-6">
            {timeline.map((item, index) => (
              <div key={item.title} className="grid grid-cols-[34px_1fr] gap-4">
                <div className="flex flex-col items-center">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${index < 2 ? "bg-[#2f2924] text-white" : "border border-[#d8ccbe] bg-[#fffaf3] text-[#7f7368]"}`}>{index < 2 ? <Check size={15} /> : index + 1}</span>
                  {index < timeline.length - 1 ? <span className="min-h-14 w-px flex-1 bg-[#e8dfd3]" /> : null}
                </div>
                <div className="pb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-[#2f2924]">{item.title}</h3>
                    <span className="rounded-full bg-[#f4ede4] px-3 py-1 text-xs text-[#6f6256]">{item.status}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#8a7252]"><Clock3 size={13} />{item.timing}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6f6256]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <SectionTitle eyebrow="Funds" title="费用与资金计算" subtitle="输入 CAS 信息，立即看到最低资金要求。" />
          <div className="mt-6 space-y-4">
            <MoneyInput label="第一学年学费" value={tuition} onChange={setTuition} />
            <MoneyInput label="CAS 已确认支付" value={paid} onChange={setPaid} />
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SmallStat label="签证申请费" value={money.format(UK_STUDENT_VISA_RULES.applicationFee)} />
            <SmallStat label="学生 IHS 标准" value={`${money.format(UK_STUDENT_VISA_RULES.ihsAnnualStudentRate)} / 年`} />
          </div>
          <p className="mt-4 text-xs leading-5 text-[#8f847a]">IHS 按实际签证有效期结算；外币资金建议预留汇率余量。最终金额以申请系统为准。</p>
        </Card>
      </section>

      <section id="final-check" className="mb-6 grid gap-6 xl:grid-cols-[1.08fr_.92fr]">
        <Card className="p-5 md:p-7">
          <SectionTitle eyebrow="Documents" title="材料清单" subtitle="核心材料优先，按个人情况显示其他材料。" />
          <div className="mt-5 divide-y divide-[#e8dfd3]">
            {materials.map((item) => (
              <div key={item.name} className="flex items-center gap-4 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f4ede4] text-[#6f6256]"><FileText size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-[#2f2924]">{item.name}</p>{item.required ? <span className="text-xs text-[#8a5f54]">必须</span> : null}</div>
                  <p className="mt-1 text-sm text-[#7f7368]">{item.note}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#f7f0e8] px-3 py-1 text-xs text-[#6f6256]">{item.state}</span>
                <ChevronRight size={16} className="shrink-0 text-[#a79a8d]" />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 md:p-7">
            <SectionTitle eyebrow="Final check" title="递交前检查" subtitle="阻塞项清零后再进入在线申请。" />
            <div className="mt-5 space-y-3">
              {["CAS 已获得且信息正确", "资金金额与 28 天记录合格", "银行材料在 31 天有效期内", "TB 与 ATAS 要求已确认", "必要翻译已完成"].map((label, index) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl bg-[#f7f0e8] p-3.5 text-sm">
                  {index === 0 ? <AlertTriangle size={17} className="text-[#a07152]" /> : <CheckCircle2 size={17} className={index === 1 ? "text-[#8ea08b]" : "text-[#b7aca1]"} />}
                  <span className="flex-1 text-[#4a3d34]">{label}</span>
                  <span className="text-xs text-[#8f847a]">{index === 1 ? "进行中" : index === 0 ? "阻塞" : "待检查"}</span>
                </div>
              ))}
            </div>
            <button disabled className="mt-5 w-full rounded-full bg-[#d8ccbe] px-5 py-3.5 text-sm font-medium text-[#7f7368]">完成阻塞项后可准备递交</button>
          </Card>

          <Card className="border border-[#e2c7bb] bg-[#f7ebe5] p-5 md:p-7">
            <div className="flex items-center gap-3"><ShieldAlert className="text-[#8a5f54]" /><h2 className="font-editorial text-3xl font-semibold">重点风险</h2></div>
            <div className="mt-5 space-y-4">
              {risks.map(([title, detail]) => <div key={title}><p className="text-sm font-semibold text-[#5f4037]">{title}</p><p className="mt-1 text-sm leading-6 text-[#7f594d]">{detail}</p></div>)}
            </div>
          </Card>
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-3 border-t border-[#e8dfd3] py-5 text-xs text-[#8f847a] sm:flex-row">
        <span>规则版本生效日：{UK_STUDENT_VISA_RULES.effectiveFrom}</span>
        <span>金额由集中规则配置提供，不写死在页面组件中。</span>
      </footer>
    </DashboardShell>
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
function Line({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><span>{label}</span><span>{value}</span></div>; }
function SmallStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#f7f0e8] p-4"><p className="text-xs text-[#8f847a]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
