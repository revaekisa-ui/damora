import { PublicPageConfig, WorkflowItem } from '../../types';

export const DEFAULT_WORKFLOWS: WorkflowItem[] = [
  {
    id: 'wf-wedding',
    title: 'Wedding Timeline',
    timeline: [
      'Konsep Acara Pernikahan / Awal → H-90',
      'Pemilihan Vendor / Detail → H-60',
      'Persiapan Final (Technical Meeting) → H-14',
      'Pelaksanaan Acara Pernikahan → Hari H',
      'Penyelesaian / Review Akhir → H+7',
      'Serah Terima File Riasan / Laporan → H+14'
    ]
  },
  {
    id: 'wf-small-event',
    title: 'Event / Acara Pernikahan Kecil Timeline',
    timeline: [
      'Konsep / Kesepakatan Awal → H-30',
      'Persiapan Final → H-7',
      'Pelaksanaan Acara Pernikahan → Hari H',
      'Penyelesaian Layanan / Laporan → H+14'
    ]
  }
];

export const getWorkflows = (config?: PublicPageConfig): WorkflowItem[] => {
  if (config?.workflows?.length) return config.workflows;

  const legacyWorkflows: WorkflowItem[] = [];
  if (config?.weddingWorkflow?.title) {
    legacyWorkflows.push({
      id: 'wf-wedding',
      title: config.weddingWorkflow.title,
      timeline: config.weddingWorkflow.timeline || [],
    });
  }
  if (config?.smallEventWorkflow?.title) {
    legacyWorkflows.push({
      id: 'wf-small-event',
      title: config.smallEventWorkflow.title,
      timeline: config.smallEventWorkflow.timeline || [],
    });
  }

  return legacyWorkflows.length > 0 ? legacyWorkflows : DEFAULT_WORKFLOWS;
};
