const labels: Record<string, string> = {
  operation: "Operação",
  service_business: "Prestação de serviços",
  project_or_business_front: "Plataforma em desenvolvimento",
  business_front: "Frente de negócios",
};

export function companySegmentLabel(segment: string | null | undefined) {
  if (!segment) return "Segmento não informado";
  if (labels[segment]) return labels[segment];
  if (/^[a-z]+(?:_[a-z]+)+$/.test(segment)) {
    const words = segment.replaceAll("_", " ");
    return words.charAt(0).toLocaleUpperCase("pt-BR") + words.slice(1);
  }
  return segment;
}
