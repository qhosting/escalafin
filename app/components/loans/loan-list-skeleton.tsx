'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoanListSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 md:mb-8 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 md:h-12" />
          <Skeleton className="h-4 w-32 hidden md:block" />
        </div>
        <Skeleton className="h-14 w-full md:w-48 rounded-2xl" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full lg:w-48" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-l-4">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/50 p-3 rounded-2xl">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Skeleton className="h-11 w-full sm:w-24 rounded-xl" />
                  <Skeleton className="h-11 w-full sm:w-24 rounded-xl" />
                  <Skeleton className="h-11 w-full sm:w-24 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
