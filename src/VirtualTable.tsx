import { useEffect, useRef, useState } from 'react';
import type { ModeResult } from './lib/mode';

interface VirtualTableProps {
  answers: ModeResult[];
  queries: { left: number; right: number }[];
}

const ROW_HEIGHT = 30;
const OVERSCAN = 12;

/** 可滚动结果表：仅渲染可视区行，20 万行也能流畅浏览，且保持原顺序。 */
export function VirtualTable({ answers, queries }: VirtualTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setViewportHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    setViewportHeight(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [answers]);

  const total = answers.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    total,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
  );

  // 可视区之外的行不渲染，但必须用占位行撑起整张表的总高度
  // （total * ROW_HEIGHT）：否则滚动容器的 scrollHeight 只等于实际渲染的
  // 数十行高度，既没有长滚动条，“滚动到末行”也永远无法抵达第 total 行。
  const topPad = startIndex * ROW_HEIGHT;
  const bottomPad = (total - endIndex) * ROW_HEIGHT;

  const spacerRow = (height: number, key: string) => (
    <tr key={key} aria-hidden="true" style={{ height, padding: 0 }}>
      <td
        colSpan={4}
        style={{ height, padding: 0, borderBottom: 'none' }}
      />
    </tr>
  );

  const rows: JSX.Element[] = [];
  if (topPad > 0) rows.push(spacerRow(topPad, 'top-spacer'));
  for (let i = startIndex; i < endIndex; i++) {
    const a = answers[i];
    const q = queries[i];
    rows.push(
      <tr
        key={i}
        className={i % 2 === 0 ? 'row-even' : 'row-odd'}
        style={{ height: ROW_HEIGHT }}
      >
        <td className="col-index" data-label="序号">
          {i + 1}
        </td>
        <td className="col-range" data-label="边界">
          [{q.left}, {q.right}]
        </td>
        <td className="col-mode" data-label="众数">
          {a.value}
        </td>
        <td className="col-count" data-label="频次">
          {a.count}
        </td>
      </tr>,
    );
  }
  if (bottomPad > 0) rows.push(spacerRow(bottomPad, 'bottom-spacer'));

  return (
    <div className="table-scroll" ref={scrollRef} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <table className="result-table">
        <thead className="result-head">
          <tr style={{ height: ROW_HEIGHT }}>
            <th className="col-index">序号</th>
            <th className="col-range">边界 [left, right]</th>
            <th className="col-mode">众数</th>
            <th className="col-count">频次</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
}
