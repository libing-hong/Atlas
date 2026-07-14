import Link from "next/link";
import { Student } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function StudentTable({ students }: { students: Student[] }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#e8dfd3] bg-[#fffaf3]/70">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-[#f4ede4] text-xs uppercase tracking-[0.18em] text-[#8f847a]">
            <tr>
              <th className="px-5 py-4 font-medium">姓名</th>
              <th className="px-5 py-4 font-medium">联系方式</th>
              <th className="px-5 py-4 font-medium">目标国家</th>
              <th className="px-5 py-4 font-medium">GPA</th>
              <th className="px-5 py-4 font-medium">语言成绩</th>
              <th className="px-5 py-4 font-medium">付费状态</th>
              <th className="px-5 py-4 font-medium">当前阶段</th>
              <th className="px-5 py-4 font-medium">最近更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8dfd3]">
            {students.map((student) => (
              <tr key={student.id} className="transition hover:bg-[#f8f1e8]">
                <td className="px-5 py-4 font-medium text-[#2f2924]">
                  <Link href={`/admin/students/${student.id}`}>{student.name}</Link>
                </td>
                <td className="px-5 py-4 text-[#6f6256]">{student.contact}</td>
                <td className="px-5 py-4 text-[#6f6256]">{student.targetCountries.join(" / ")}</td>
                <td className="px-5 py-4 text-[#6f6256]">{student.gpa}</td>
                <td className="px-5 py-4 text-[#6f6256]">{student.language}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={student.paidStatus} />
                </td>
                <td className="px-5 py-4 text-[#6f6256]">{student.stage}</td>
                <td className="px-5 py-4 text-[#6f6256]">{student.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
