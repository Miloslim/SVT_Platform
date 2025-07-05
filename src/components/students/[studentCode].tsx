// pages/students/[studentCode].tsx
import { useRouter } from "next/router";
import StudentDashboard from "@/components/StudentDashboard";

const StudentDetailPage = () => {
  const router = useRouter();
  const { studentCode } = router.query;

  if (!studentCode || typeof studentCode !== "string") {
    return <p className="text-center text-red-500">Code élève invalide.</p>;
  }

  return <StudentDashboard studentCode={studentCode} />;
};

export default StudentDetailPage;
