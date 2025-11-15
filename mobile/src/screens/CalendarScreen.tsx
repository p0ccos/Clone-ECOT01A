import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  FlatList, 
  ActivityIndicator
} from 'react-native';

import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import  api  from '@/services/api'; 

// Configura o calendário para Português 
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Fev.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// --- Interfaces ---
interface ApiEvent {
  id: number;
  title: string;
  description: string;
  start_time: string; 
  end_time: string;
  category: 'ACADEMIC' | 'CAMPUS' | 'USER_PRIVATE';
}

// Interface para os 'markedDates'
interface MarkedDate {
  [date: string]: {
    dots?: { key: string; color: string; }[],
    selected?: boolean,
    selectedColor?: string,
  }
}

// Retorna 'YYYY-MM-DD' de um objeto Date
const toDateString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Cores
const CATEGORY_COLORS = {
  'ACADEMIC': '#FF3B30',   
  'CAMPUS': '#007AFF',     
  'USER_PRIVATE': '#34C759', 
  'default': '#8E8E93'     
};

const CalendarScreen = () => {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para o dia que o usuário selecionou
  const [selectedDay, setSelectedDay] = useState(toDateString(new Date()));
  
  // Estado que armazena TODOS os eventos do mês carregado
  const [eventsForMonth, setEventsForMonth] = useState<ApiEvent[]>([]);
  
  // Estado para as marcações (bolinhas e seleção)
  const [markedDates, setMarkedDates] = useState<MarkedDate>({});

  // 1. Função para buscar eventos do mês
  const fetchEvents = useCallback(async (date: Date) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const response = await api.get<ApiEvent[]>(`/events?month=${month}&year=${year}`);
      const events = response.data;
      
      setEventsForMonth(events);
      
      // Processa os eventos para criar as "bolinhas"
      const dots: MarkedDate = {};
      events.forEach(event => {
        const dateStr = event.start_time.split('T')[0];
        if (!dots[dateStr]) {
          dots[dateStr] = { dots: [] };
        }
        dots[dateStr].dots!.push({
          key: event.id.toString(),
          color: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default
        });
      });

      // Atualiza as marcações, mantendo o dia selecionado
      setMarkedDates(prevMarks => ({
        ...prevMarks,
        ...dots,
        [selectedDay]: {
          ...dots[selectedDay], // Pega as bolinhas do dia (se houver)
          selected: true,
          selectedColor: '#007AFF'
        }
      }));

    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      Alert.alert("Erro", "Não foi possível carregar os eventos.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedDay]); // Depende de selectedDay para recriar a seleção

  // 2. Carrega os eventos do mês atual quando a tela é montada
  useEffect(() => {
    fetchEvents(new Date());
  }, []); // Roda só uma vez

  // 3. Função chamada quando o usuário muda o mês no calendário
  const onMonthChange = (date: DateData) => {
    fetchEvents(new Date(date.timestamp));
  };

  // 4. Função chamada quando o usuário clica em um dia
  const onDayPress = (day: DateData) => {
    const newSelectedDay = day.dateString;
    setSelectedDay(newSelectedDay);
    
    // Atualiza o 'markedDates' para refletir a nova seleção
    setMarkedDates(prevMarks => {
      const newMarks = { ...prevMarks };

      // Limpa a seleção antiga (se houver)
      Object.keys(newMarks).forEach(key => {
        if (newMarks[key]) {
          delete newMarks[key]!.selected;
        }
      });

      // Adiciona a nova seleção
      newMarks[newSelectedDay] = {
        ...newMarks[newSelectedDay], // Mantém as bolinhas que já existiam
        selected: true,
        selectedColor: '#007AFF'
      };
      return newMarks;
    });
  };

  // 5. Filtra os eventos para mostrar apenas os do dia selecionado
  // useMemo otimiza para não refiltrar a cada renderização
  const eventsForSelectedDay = useMemo(() => {
    return eventsForMonth.filter(event => 
      event.start_time.startsWith(selectedDay)
    );
  }, [eventsForMonth, selectedDay]);

  // 6. Renderiza cada item da lista
  const renderItem = ({ item }: { item: ApiEvent }) => (
    <TouchableOpacity style={styles.itemContainer}>
       <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default }]} />
       <View style={styles.itemTextContent}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.description && <Text>{item.description}</Text>}
       </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Calendar
        style={styles.calendar}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        markedDates={markedDates}
        markingType={'multi-dot'} // Habilita múltiplas bolinhas
      />
      
      {/* A Lista de Eventos */}
      <FlatList
        style={styles.list}
        data={eventsForSelectedDay}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyDate}>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <Text>Nenhum evento para este dia.</Text>
            )}
          </View>
        }
      />
      
      {/* Botão Flutuante */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddEventScreen')}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  calendar: {
    // Estilos para o calendário
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  list: {
    flex: 1, 
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  // Estilos para os itens da lista
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    marginTop: 5,
  },
  itemTextContent: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  emptyDate: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
  }
});

export default CalendarScreen;