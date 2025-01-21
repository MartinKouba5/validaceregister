import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', country: '' });
  const [countries, setCountries] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch countries from backend
    fetch('http://localhost:8081/countries')
      .then((response) => response.json())
      .then((data) => setCountries(data))
      .catch((error) => console.error('Error fetching countries:', error));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[!@#$%^&*()_+=\-{};:'",.<>?]).{8,}$/;

    if (!formData.name.match(/^[a-zA-Z0-9]+$/)) {
      newErrors.name = 'Jméno musí obsahovat pouze alfanumerické znaky';
    }
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu';
    }
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Heslo musí mít min. 8 znaků a splnit bezpečnostní požadavky';
    }
    if (!formData.country) {
      newErrors.country = 'Vyberte platnou zemi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      fetch('http://localhost:8081/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message) {
            alert(data.message);
          } else {
            alert('Registrace byla úspěšná!');
          }
        })
        .catch((error) => console.error('Error during registration:', error));
    }
  };


  return (
    <div className="App">
      <h1>Registrace</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Jméno:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          {errors.name && <p className="error">{errors.name}</p>}
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>
        <div>
          <label>Heslo:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          {errors.password && <p className="error">{errors.password}</p>}
        </div>
        <div>
          <label>Země:</label>
          <select
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          >
            <option value="">Vyberte zemi</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country && <p className="error">{errors.country}</p>}
        </div>
        <button type="submit">Registrovat</button>
      </form>
    </div>
  );
}

export default App;
