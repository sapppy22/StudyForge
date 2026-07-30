import class9 from "@/templates/class9.json";
import jee from "@/templates/jee.json";

export interface TopicTemplate {
  title: string;
  topics?: string[];
}

export interface ChapterTemplate {
  title: string;
  topics?: string[];
}

export interface SubjectTemplate {
  title: string;
  chapters?: ChapterTemplate[];
}

export interface SyllabusTemplate {
  examType: string;
  title: string;
  subjects: SubjectTemplate[];
}

const templates: Record<string, SyllabusTemplate> = {
  CLASS_9: class9 as SyllabusTemplate,
  JEE_MAIN: jee as SyllabusTemplate,
};

export function listTemplates() {
  return Object.entries(templates).map(([key, value]) => ({
    key,
    title: value.title,
    examType: value.examType,
  }));
}

export function getTemplate(examType: string): SyllabusTemplate | undefined {
  return templates[examType];
}
