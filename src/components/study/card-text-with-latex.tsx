"use client";

import katex from "katex";
import { Fragment, useMemo, type ReactNode } from "react";
import "katex/dist/katex.min.css";

const LATEX_SEGMENT =
  /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

type CardTextWithLatexProps = {
  text: string;
  latexEnabled: boolean;
  className?: string;
};

function renderLatexSegment(latex: string, displayMode: boolean, key: string) {
  try {
    const html = katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode,
      strict: "ignore",
    });
    if (displayMode) {
      return (
        <span
          key={key}
          className="my-2 block [&>.katex]:text-[1.1em]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    return (
      <span
        key={key}
        className="inline [&>.katex]:text-[1.05em]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return (
      <span key={key} className="font-mono text-sm text-rose-600">
        {displayMode ? `$$${latex}$$` : `$${latex}$`}
      </span>
    );
  }
}

function parseLatexText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let segmentIndex = 0;

  LATEX_SEGMENT.lastIndex = 0;
  while ((match = LATEX_SEGMENT.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`t-${segmentIndex++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }
    const blockLatex = match[1];
    const inlineLatex = match[2];
    if (blockLatex !== undefined) {
      nodes.push(renderLatexSegment(blockLatex, true, `b-${segmentIndex++}`));
    } else if (inlineLatex !== undefined) {
      nodes.push(renderLatexSegment(inlineLatex, false, `i-${segmentIndex++}`));
    }
    lastIndex = LATEX_SEGMENT.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`t-${segmentIndex++}`}>{text.slice(lastIndex)}</Fragment>,
    );
  }

  return nodes.length > 0 ? nodes : [text];
}

export function CardTextWithLatex({
  text,
  latexEnabled,
  className,
}: CardTextWithLatexProps) {
  const content = useMemo(() => {
    if (!latexEnabled) {
      return null;
    }
    return parseLatexText(text);
  }, [text, latexEnabled]);

  if (!latexEnabled) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div
      className={`text-pretty leading-relaxed [&_.katex]:text-inherit ${className ?? ""}`}
    >
      {content}
    </div>
  );
}
