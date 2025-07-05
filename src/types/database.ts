// src/types/database.ts

export type Database = {
  students: {
    Row: {
      id: number;
      student_code: string;
      first_name: string;
      last_name: string;
      birth_date: string;
      student_class: string;
    };
    Insert: {
      student_code: string;
      first_name: string;
      last_name: string;
      birth_date: string;
      student_class: string;
    };
    Update: {
      student_code?: string;
      first_name?: string;
      last_name?: string;
      birth_date?: string;
      student_class?: string;
    };
  };
};
