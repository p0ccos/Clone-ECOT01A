import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import api from '@/services/api'; 

// Um botão reutilizável
const CustomButton = ({ title, onPress, style }: any) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const AddEventScreen = () => {
  const navigation = useNavigation();
  
  // Estados do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(new Date()); // Começa com a data/hora atual
  const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 60 * 60 * 1000)); // Começa 1h à frente
  const [isLoading, setIsLoading] = useState(false);

  // Estados para controlar os seletores de data/hora
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Função chamada quando o seletor de INÍCIO é alterado
  const onChangeStartTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios'); // No iOS, mantém aberto; no Android, fecha
    if (selectedDate) {
      setStartTime(selectedDate);
      // Opcional: Ajusta a data final se a inicial passar dela
      if (selectedDate > endTime) {
        setEndTime(new Date(selectedDate.getTime() + 60 * 60 * 1000)); // +1 hora
      }
    }
  };

  // Função chamada quando o seletor de FIM é alterado
  const onChangeEndTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  // Função para salvar o evento na API
  const handleSaveEvent = () => {
    // Apenas mostra o alerta e não faz mais nada
    Alert.alert(
      'Em Breve',
      'Funcionalidade disponível em breve.'
    );
  };

  // Formata a data e hora para mostrar no botão
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Input de Título */}
      <Text style={styles.label}>Título do Evento*</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Prova de Cálculo II"
        value={title}
        onChangeText={setTitle}
      />

      {/* Input de Descrição */}
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Ex: Estudar capítulos 4 e 5"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      {/* Seletor de Data/Hora de INÍCIO */}
      <Text style={styles.label}>Início</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
        <Text>{formatDateTime(startTime)}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="datetime" 
          display="default"
          onChange={onChangeStartTime}
        />
      )}

      {/* Seletor de Data/Hora de TÉRMINO */}
      <Text style={styles.label}>Término</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
        <Text>{formatDateTime(endTime)}</Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="datetime"
          display="default"
          onChange={onChangeEndTime}
          minimumDate={startTime} 
        />
      )}

      {/* Botão de Salvar */}
      <CustomButton
        title={isLoading ? 'Salvando...' : 'Salvar Evento'}
        onPress={handleSaveEvent}
        disabled={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top', 
  },
  dateButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30, 
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddEventScreen;