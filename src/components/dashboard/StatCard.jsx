import React from 'react';
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatCard({ title, value, subtitle, icon: Icon, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
        <div className="relative p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
          </div>
          {subtitle && (
            <p className="text-white/70 text-xs font-medium">{subtitle}</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
