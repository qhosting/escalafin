'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, User, CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function GlobalSearch({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ clients: any[], loans: any[] }>({ clients: [], loans: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults({ clients: [], loans: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const onSelect = (route: string) => {
    router.push(route);
    onOpenChange(false);
  };

  const rolePath = session?.user?.role?.toLowerCase() || 'admin';

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Busca clientes, préstamos..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Buscando...</span>
            </div>
          ) : (
            query.length >= 3 ? 'No se encontraron resultados.' : 'Escribe al menos 3 caracteres...'
          )}
        </CommandEmpty>

        {results.clients.length > 0 && (
          <CommandGroup heading="Clientes">
            {results.clients.map((client) => (
              <CommandItem
                key={client.id}
                onSelect={() => onSelect(`/${rolePath}/clients/${client.id}`)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>{client.firstName} {client.lastName}</span>
                <span className="ml-auto text-xs text-muted-foreground">{client.phone}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.loans.length > 0 && (
          <CommandGroup heading="Préstamos">
            {results.loans.map((loan) => (
              <CommandItem
                key={loan.id}
                onSelect={() => onSelect(`/${rolePath}/loans/${loan.id}`)}
                className="cursor-pointer"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>{loan.loanNumber}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {loan.client.firstName} {loan.client.lastName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
