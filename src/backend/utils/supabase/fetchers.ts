// utils/supabase/fetchers.ts
import { supabase } from "../../backend/config/supabase";

export const fetchSequences = async () => {
  const { data, error } = await supabase.from("sequences").select("*");
  if (error) throw new Error(error.message);
  return data;
};

export const fetchActivities = async () => {
  const { data, error } = await supabase.from("activities").select("*");
  if (error) throw new Error(error.message);
  return data;
};

// Ajoute fetchUnits, fetchObjectives, etc., selon tes besoins
