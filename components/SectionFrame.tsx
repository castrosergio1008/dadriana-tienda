import type { ReactNode } from 'react';

type SectionFrameProps = {
  visible: boolean;
  children: ReactNode;
};

// Data-driven sections leave no DOM node and no layout gap when hidden.
export function SectionFrame({ visible, children }: SectionFrameProps) {
  return visible ? <>{children}</> : null;
}
