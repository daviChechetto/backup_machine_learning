CREATE TABLE clients (
    id VARCHAR(50) PRIMARY KEY,
    monthly_incomes DECIMAL(10, 2) NOT NULL,
    active_debts DECIMAL(10, 2) NOT NULL,
    days_in_arrears INT NOT NULL,
    payment_histories INT NOT NULL,
    behavioral_clusters INT NOT NULL,
    credit_scores INT NOT NULL,
    recommended_credit_limits DECIMAL(10, 2) NOT NULL
);

INSERT INTO clients (id, monthly_incomes, active_debts, days_in_arrears, payment_histories, behavioral_clusters, credit_scores, recommended_credit_limits) 
VALUES
('CLIENTE-49210', 3500.00, 500.00, 0, 1, 1, 750, 1050.00),
('CLIENTE-81734', 1800.00, 1200.00, 25, 0, 0, 290, 0.00),
('CLIENTE-10394', 8200.00, 300.00, 0, 1, 2, 920, 3017.60),
('CLIENTE-55102', 4100.00, 2000.00, 5, 1, 1, 620, 1016.80);