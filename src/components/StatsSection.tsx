export const StatsSection = () => {
  const stats = [
    { number: "10,000+", label: "Active Members" },
    { number: "50,000+", label: "Skills Exchanged" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "200+", label: "Skill Categories" },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};