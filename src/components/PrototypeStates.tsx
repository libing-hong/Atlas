"use client";

import { AlertTriangle, Loader2, PackageOpen } from "lucide-react";
import { Card, CardHeader } from "./Card";
import { T } from "./language/LanguageProvider";

export function PrototypeStateGallery({ pageName }: { pageName: string }) {
  return (
    <Card className="border-dashed bg-[#fffaf3]/58">
      <CardHeader title={<T en="Prototype states" zh="原型状态" />} eyebrow="Visual validation" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[18px] border border-[#e8dfd3] bg-[#f7f0e8] p-4">
          <Loader2 className="text-[#8ea08b]" size={20} />
          <h3 className="mt-3 text-sm font-semibold">
            <T en="Loading state" zh="加载状态" />
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6f6256]">
            <T
              en={`Atlas is preparing ${pageName} from your saved journey context.`}
              zh="Atlas 正在根据已保存的旅程上下文准备这个页面。"
            />
          </p>
        </div>
        <div className="rounded-[18px] border border-[#e8dfd3] bg-[#f7f0e8] p-4">
          <PackageOpen className="text-[#c8a96b]" size={20} />
          <h3 className="mt-3 text-sm font-semibold">
            <T en="Empty state" zh="空状态" />
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6f6256]">
            <T
              en="This area is empty when Atlas does not yet have enough facts. The next step is to add one relevant document or answer one focused question."
              zh="当 Atlas 暂时没有足够信息时，这里会显示空状态。下一步是添加一个相关文件，或回答一个聚焦问题。"
            />
          </p>
        </div>
        <div className="rounded-[18px] border border-[#e8dfd3] bg-[#f7f0e8] p-4">
          <AlertTriangle className="text-[#9d6b55]" size={20} />
          <h3 className="mt-3 text-sm font-semibold">
            <T en="Error state" zh="错误状态" />
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6f6256]">
            <T
              en="If Atlas cannot load this view, it should preserve your place and explain what can be retried."
              zh="如果 Atlas 无法加载这个视图，它应保留你当前的位置，并说明可以重试什么。"
            />
          </p>
        </div>
      </div>
    </Card>
  );
}
