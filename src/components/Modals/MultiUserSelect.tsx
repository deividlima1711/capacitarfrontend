import React from 'react';

interface MultiUserSelectProps {
  usuarios: Array<{ id: number; nome: string }>;
  value: number[];
  onChange: (ids: number[]) => void;
}

const MultiUserSelect: React.FC<MultiUserSelectProps> = ({ usuarios, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
    onChange(selected);
  };

  return (
    <select
      multiple
      value={value.map(String)}
      onChange={handleChange}
      style={{ width: '100%', minHeight: 80, borderRadius: 6, border: '1px solid #dfe1e6', padding: 6 }}
    >
      {usuarios.map(usuario => (
        <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>
      ))}
    </select>
  );
};

export default MultiUserSelect;
