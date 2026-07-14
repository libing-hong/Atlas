import { T } from "../language/LanguageProvider";

const simpleSteps = [
  {
    title: { en: "Check your information", zh: "核对信息" },
    body: {
      en: "Confirm that your name, school, accommodation, and key personal details are correct.",
      zh: "确认姓名、学校、住宿等资料是否正确。",
    },
  },
  {
    title: { en: "Use what Atlas prepared", zh: "使用 Atlas 准备的内容" },
    body: {
      en: "Copy, download, or use the answers and files Atlas has prepared for this step.",
      zh: "复制、下载或使用已准备好的答案和文件。",
    },
  },
  {
    title: { en: "Tell Atlas when you are done", zh: "完成后告诉 Atlas" },
    body: {
      en: "Upload a screenshot or confirm the document so Atlas can update this task.",
      zh: "上传截图或确认文件，Atlas 更新这件事。",
    },
  },
];

export function SimpleSteps() {
  return (
    <ol className="grid gap-3 text-sm text-[#5d5148]">
      {simpleSteps.map((step, index) => (
        <li key={step.title.en} className="flex gap-3 rounded-2xl bg-[#f7f0e8] p-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2f2924] text-xs text-[#fffaf3]">
            {index + 1}
          </span>
          <span>
            <strong className="block text-[#2f2924]">
              <T en={step.title.en} zh={step.title.zh} />
            </strong>
            <span className="mt-1 block leading-6">
              <T en={step.body.en} zh={step.body.zh} />
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
