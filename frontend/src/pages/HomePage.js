import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="page">
      <div className="hero">
        <h2>Облачное хранилище My Cloud</h2>
        <p style={{ margin: 0 }}>
          Храните файлы, загружайте, переименовывайте и скачивайте их по специальным ссылкам.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Link to="/register" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Регистрация
          </Link>
          <Link to="/login" className="btn" style={{ textDecoration: "none" }}>
            Вход
          </Link>
        </div>
      </div>
    </div>
  );
}

