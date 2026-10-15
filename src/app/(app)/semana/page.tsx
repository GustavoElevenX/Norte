import { PageHeading } from "@/components/ui";
import { ScheduleList } from "@/components/schedule";
import { getCompanies } from "@/lib/queries";
import { selectedCompanyId } from "@/lib/filter";
import { addDays, companyScheduleColors, dayLabels, getSchedule, localDate, weekDates } from "@/lib/schedule";
import { norteSeed } from "@/lib/norte-seed";

export default async function Semana() {
  const current = weekDates(localDate());
  const dates = current[0] < norteSeed.metadata.effective_from ? weekDates(addDays(current[0], 7)) : current;
  const [days, companies] = await Promise.all([getSchedule(dates), getCompanies()]);
  const companyId = await selectedCompanyId(companies);
  return <><PageHeading title="Minha Semana" description={`${dates[0] !== current[0] ? "Próxima semana completa" : "Semana atual"} · horários de Fortaleza`} />
    <div className="week-grid">{days.map((day, index) => <section className="week-day" key={day.date}>
      <h2>{dayLabels[index]} <span>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${day.date}T12:00:00Z`))}</span></h2>
      <ScheduleList slots={day.slots} companyId={companyId} colors={companyScheduleColors(companies)} />
    </section>)}</div></>;
}
