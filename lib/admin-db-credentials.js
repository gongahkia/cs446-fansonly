export function getSimulatedAdminDbCredentials() {
  return {
    host: "db.fansonly.internal",
    port: "5432",
    database: "fansonly_reporting",
    username: "catalog_admin",
    password: "Ww-warehouse-2026!",
    sslMode: "require",
    note: "Training-only internal reporting replica."
  };
}
