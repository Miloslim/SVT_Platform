///backend/api/absences.ts
import { supabase } from "../config/supabase";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ error: "ID étudiant manquant" });
  }

  const { data, error } = await supabase
    .from("student_absences")
    .select("*")
    .eq("student_id", studentId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
}
