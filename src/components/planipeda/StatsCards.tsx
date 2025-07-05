// src/components/planipeda/StatsCards.tsx

const StatsCards = () => {
  const stats = [
    { label: "Fiches totales", value: 24, icon: "📄" },
    { label: "Fiches en cours", value: 12, icon: "🛠️" },
    { label: "Fiches finalisées", value: 10, icon: "✅" },
    { label: "Dernière modification", value: "08/05/2025", icon: "🕒" },
  ];

  return (
    <section className="stats-container">
      {stats.map((stat, index) => (
        <div key={index} className="stats-card">
          <div className="stats-icon">{stat.icon}</div>
          <div className="stats-content">
            <p className="stats-label">{stat.label}</p>
            <p className="stats-value">{stat.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default StatsCards;
