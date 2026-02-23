import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Eye,
  Users,
  MousePointerClick,
  DollarSign,
  Target,
  Megaphone,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = [
  "hsl(210, 100%, 56%)",
  "hsl(150, 60%, 45%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 90%, 55%)",
  "hsl(350, 70%, 55%)",
  "hsl(180, 60%, 45%)",
];

const spendChartConfig = {
  spend: { label: "Investimento (R$)", color: "hsl(210, 100%, 56%)" },
};
const impressionsChartConfig = {
  impressions: { label: "Impressões", color: "hsl(210, 100%, 56%)" },
  reach: { label: "Alcance", color: "hsl(150, 60%, 45%)" },
};
const clicksChartConfig = {
  clicks: { label: "Cliques", color: "hsl(210, 100%, 56%)" },
  resultado: { label: "Resultados", color: "hsl(280, 60%, 55%)" },
};
const ctrChartConfig = {
  ctr: { label: "CTR (%)", color: "hsl(30, 90%, 55%)" },
  cpc: { label: "CPC (R$)", color: "hsl(350, 70%, 55%)" },
};

const fmt = (v) =>
  v != null ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—";

const fmtBRL = (v) =>
  v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

const StatCardFB = ({ title, value, icon: Icon, subtitle }) => (
  <Card className="relative overflow-hidden border-none shadow-lg">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
    <CardContent className="relative p-6 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          <p className="text-white/70 text-xs font-medium mt-1">{subtitle}</p>
        </div>
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function FacebookAds() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: rows, error } = await supabase
        .from("facebook_ads_performance")
        .select("*")
        .order("data_referencia", { ascending: true });
      if (!error && rows) setData(rows);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Totals
  const totalSpend = data.reduce((s, r) => s + (r.spend ?? 0), 0);
  const totalImpressions = data.reduce((s, r) => s + (r.impressions ?? 0), 0);
  const totalClicks = data.reduce((s, r) => s + (r.clicks ?? 0), 0);
  const totalReach = data.reduce((s, r) => s + (r.reach ?? 0), 0);
  const totalResultados = data.reduce((s, r) => s + (r.resultado ?? 0), 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const avgCPR = totalResultados > 0 ? totalSpend / totalResultados : 0;

  // Group by ad for charts
  const byAd = data.map((r) => ({
    name: r.adset_name || r.ad_name,
    spend: r.spend ?? 0,
    impressions: r.impressions ?? 0,
    reach: r.reach ?? 0,
    clicks: r.clicks ?? 0,
    resultado: r.resultado ?? 0,
    ctr: r.ctr ?? 0,
    cpc: r.cpc ?? 0,
    cpm: r.cpm ?? 0,
    custo_por_resultado: r.custo_por_resultado ?? 0,
  }));

  // Spend by campaign (pie)
  const campaignMap = new Map();
  data.forEach((r) => {
    campaignMap.set(r.campaign_name, (campaignMap.get(r.campaign_name) ?? 0) + (r.spend ?? 0));
  });
  const spendByCampaign = Array.from(campaignMap.entries()).map(([name, value], i) => ({
    name,
    value: +value.toFixed(2),
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Megaphone className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Facebook Ads Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{data.length} anúncios</Badge>
          <Avatar className="h-8 w-8 bg-blue-600">
            <AvatarFallback className="bg-blue-600 text-white text-xs">FB</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardFB title="Investimento Total" value={fmtBRL(totalSpend)} icon={DollarSign} subtitle={`CPM médio: ${fmtBRL(avgCPM)}`} />
          <StatCardFB title="Impressões" value={fmt(totalImpressions)} icon={Eye} subtitle={`Alcance: ${fmt(totalReach)}`} />
          <StatCardFB title="Cliques" value={fmt(totalClicks)} icon={MousePointerClick} subtitle={`CTR: ${avgCTR.toFixed(2)}% · CPC: ${fmtBRL(avgCPC)}`} />
          <StatCardFB title="Resultados" value={fmt(totalResultados)} icon={Target} subtitle={`Custo/Resultado: ${fmtBRL(avgCPR)}`} />
        </div>

        {/* Charts */}
        <Tabs defaultValue="spend" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="spend"><DollarSign className="w-4 h-4 mr-1" /> Investimento</TabsTrigger>
            <TabsTrigger value="impressions"><Eye className="w-4 h-4 mr-1" /> Impressões & Alcance</TabsTrigger>
            <TabsTrigger value="clicks"><MousePointerClick className="w-4 h-4 mr-1" /> Cliques & Resultados</TabsTrigger>
            <TabsTrigger value="ctr"><Users className="w-4 h-4 mr-1" /> CTR & CPC</TabsTrigger>
          </TabsList>

          <TabsContent value="spend">
            <Card>
              <CardHeader>
                <CardTitle>Investimento por Anúncio</CardTitle>
                <CardDescription>Gasto (R$) por conjunto de anúncio</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={spendChartConfig} className="h-[350px] w-full">
                  <BarChart data={byAd}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="spend" fill="var(--color-spend)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impressions">
            <Card>
              <CardHeader>
                <CardTitle>Impressões vs Alcance</CardTitle>
                <CardDescription>Comparativo por anúncio</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={impressionsChartConfig} className="h-[350px] w-full">
                  <AreaChart data={byAd}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="impressions" fill="var(--color-impressions)" stroke="var(--color-impressions)" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="reach" fill="var(--color-reach)" stroke="var(--color-reach)" fillOpacity={0.3} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clicks">
            <Card>
              <CardHeader>
                <CardTitle>Cliques vs Resultados</CardTitle>
                <CardDescription>Performance por anúncio</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={clicksChartConfig} className="h-[350px] w-full">
                  <BarChart data={byAd}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resultado" fill="var(--color-resultado)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ctr">
            <Card>
              <CardHeader>
                <CardTitle>CTR & CPC</CardTitle>
                <CardDescription>Eficiência por anúncio</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={ctrChartConfig} className="h-[350px] w-full">
                  <LineChart data={byAd}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="ctr" stroke="var(--color-ctr)" strokeWidth={2} />
                    <Line type="monotone" dataKey="cpc" stroke="var(--color-cpc)" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom: Pie + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spend by Campaign Pie */}
          <Card>
            <CardHeader>
              <CardTitle>Gasto por Campanha</CardTitle>
              <CardDescription>Distribuição do investimento</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={spendChartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie data={spendByCampaign} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {spendByCampaign.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="mt-4 space-y-2">
                {spendByCampaign.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground truncate max-w-[150px]">{item.name}</span>
                    </div>
                    <span className="font-medium">{fmtBRL(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Full Data Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento dos Anúncios</CardTitle>
                <CardDescription>Todos os dados de facebook_ads_performance</CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conjunto</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Gasto</TableHead>
                      <TableHead>Impr.</TableHead>
                      <TableHead>Alcance</TableHead>
                      <TableHead>Cliques</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>CPC</TableHead>
                      <TableHead>CPM</TableHead>
                      <TableHead>Result.</TableHead>
                      <TableHead>Custo/Res.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.adset_name || row.ad_name}</TableCell>
                        <TableCell>{row.campaign_name}</TableCell>
                        <TableCell>{fmtBRL(row.spend)}</TableCell>
                        <TableCell>{fmt(row.impressions)}</TableCell>
                        <TableCell>{fmt(row.reach)}</TableCell>
                        <TableCell>{fmt(row.clicks)}</TableCell>
                        <TableCell>{fmt(row.ctr)}%</TableCell>
                        <TableCell>{fmtBRL(row.cpc)}</TableCell>
                        <TableCell>{fmtBRL(row.cpm)}</TableCell>
                        <TableCell>{fmt(row.resultado)}</TableCell>
                        <TableCell>{fmtBRL(row.custo_por_resultado)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
