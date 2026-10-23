// Zippy Logistics synthetic prototype for autonomous freight orchestration in Tamil Nadu. Includes customer and vehicle-provider roles, booking, dispatch, matching, tracking, verification, payments, compliance, and AI-assisted workflows. Development uses synthetic data with sandbox-first testing and controlled promotion to production.
workspace "Zippy Synthetic Prototype" {
  acceptance = {ai_terms: true}
  preferences = {
    internal_docs    : true
    track_performance: true
    sql_names        : false
    sql_columns      : true
  }
}