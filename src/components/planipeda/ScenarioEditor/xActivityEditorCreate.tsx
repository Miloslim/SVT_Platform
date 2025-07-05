// src/components/planipeda/ScenarioEditor/ActivityEditorCreate.tsx
import React from "react";
import ActivityEditor from "../ActivityEditor";

const ActivityEditorCreate: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  return <ActivityEditor onSaved={onSaved} />;
};

export default ActivityEditorCreate;
