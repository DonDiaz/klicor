import { routeCategories, sampleRoutes } from "@/lib/sample-routes";

function RouteCard({ route }) {
  const actionLabel = route.progress > 0 ? "Continuar ruta" : "Explorar ruta";

  return (
    <article className="route-card">
      <img src={route.image} alt="" />
      <div className="route-card-body">
        <div className="route-card-kicker">
          <span>{route.category}</span>
          <span>{route.points} puntos</span>
        </div>
        <h2>{route.name}</h2>
        <p>{route.description}</p>
        <div className="route-card-meta">
          <span>{route.duration}</span>
          <span>{route.difficulty}</span>
          <span>{route.progress}%</span>
        </div>
        <button type="button">{actionLabel}</button>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <main className="dorika-shell">
      <section className="hero-card">
        <span className="eyebrow">Dorika</span>
        <h1>Explora Ocaña</h1>
        <p>Descubre rutas históricas, religiosas y ecológicas para conocer la ciudad de una forma diferente.</p>
      </section>

      <label className="search-box">
        <span>Buscar</span>
        <input placeholder="Buscar rutas o lugares" />
      </label>

      <div className="filter-row" aria-label="Filtros de rutas">
        {routeCategories.map((category, index) => (
          <button className={index === 0 ? "is-active" : ""} key={category} type="button">
            {category}
          </button>
        ))}
      </div>

      <section className="section-head">
        <span>Rutas disponibles</span>
        <h2>Empieza por una experiencia guiada</h2>
      </section>

      <section className="route-list">
        {sampleRoutes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </section>
    </main>
  );
}
