/**
 * Seed data generator for Goat Farm Management System.
 */
'use strict';

const db = require('./db');
const bcrypt = require('bcryptjs');

function ensureDefaultUsers() {
  const adminHash = bcrypt.hashSync('admin', 10);
  const user1Hash = bcrypt.hashSync('user1', 10);
  const user2Hash = bcrypt.hashSync('user2', 10);

  const defaultUsers = [
    { username: 'admin', hash: adminHash, full_name: 'Administrator', role: 'admin' },
    { username: 'user1', hash: user1Hash, full_name: 'User One', role: 'user' },
    { username: 'user2', hash: user2Hash, full_name: 'User Two', role: 'user' }
  ];

  for (const u of defaultUsers) {
    const existing = db.get('SELECT id FROM users WHERE username = ?', [u.username]);
    if (!existing) {
      db.run(
        'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        [u.username, u.hash, u.full_name, u.role]
      );
    } else {
      // Update role and password if needed to ensure standard admin/user1/user2 logins work as expected
      db.run(
        'UPDATE users SET password_hash = ?, role = ? WHERE username = ?',
        [u.hash, u.role, u.username]
      );
    }
  }
}

/**
 * Seeds the starter breed list exactly once (tracked with PRAGMA user_version),
 * so breeds an admin deletes later are not re-created on the next restart.
 */
function ensureDefaultBreeds() {
  const v = db.get('PRAGMA user_version');
  if (v && v.user_version >= 1) return;
  for (const name of ['Saanen', 'Boer', 'Alpine', 'Nubian', 'Kiko']) {
    db.run('INSERT OR IGNORE INTO breeds (name) VALUES (?)', [name]);
  }
  // Also pick up any breeds already used by existing goats.
  db.run(`INSERT OR IGNORE INTO breeds (name)
          SELECT DISTINCT TRIM(breed) FROM goats WHERE breed IS NOT NULL AND TRIM(breed) <> ''`);
  db.exec('PRAGMA user_version = 1');
}

function seedDatabase() {
  ensureDefaultUsers();
  ensureDefaultBreeds();

  // Demo data is only inserted into a brand-new database. Once settings exist
  // the DB has been initialised, so an empty goats table (e.g. after the demo
  // data was cleared for real testing) must NOT trigger a re-seed.
  const existingGoats = db.get('SELECT COUNT(*) as count FROM goats');
  const existingSettings = db.get('SELECT COUNT(*) as count FROM farm_settings');
  if ((existingGoats && existingGoats.count > 0) || (existingSettings && existingSettings.count > 0)) {
    console.log('Database already initialised. Skipping demo seed.');
    return;
  }

  console.log('Seeding database with realistic farm demo data...');

  db.transaction(() => {
    // Goats - Generation 1 (Ancestors / Senior Breeders)
    // ID 1: Titan (Boer Buck)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, purchase_date, purchase_price, health_status, breeding_status, current_location, status) VALUES
      ('Titan', 'QR-GOAT-001', 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=400&q=80', 'Boer', 'male', '2022-03-15', 85.5, 'White & Red Head', '2022-10-01', 220000, 'Healthy', 'Active Breeder', 'Pen A (Bucks)', 'active')
    `);
    // ID 2: Bella (Boer Doe)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, purchase_date, purchase_price, health_status, breeding_status, current_location, status) VALUES
      ('Bella', 'QR-GOAT-002', 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=400&q=80', 'Boer', 'female', '2022-04-10', 62.0, 'White & Brown', '2022-10-01', 140000, 'Healthy', 'Resting', 'Pen B (Does)', 'active')
    `);
    // ID 3: Apollo (Saanen Buck)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, purchase_date, purchase_price, health_status, breeding_status, current_location, status) VALUES
      ('Apollo', 'QR-GOAT-003', 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=400&q=80', 'Saanen', 'male', '2022-01-20', 78.0, 'Pure White', '2022-08-15', 200000, 'Healthy', 'Active Breeder', 'Pen A (Bucks)', 'active')
    `);
    // ID 4: Luna (Saanen Doe)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, purchase_date, purchase_price, health_status, breeding_status, current_location, status) VALUES
      ('Luna', 'QR-GOAT-004', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80', 'Saanen', 'female', '2022-05-12', 58.5, 'White', '2022-08-15', 120000, 'Healthy', 'Pregnant', 'Maternity Pen 1', 'active')
    `);

    // Goats - Generation 2 (Offspring of Gen 1)
    // ID 5: Daisy (Daughter of Titan & Bella)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, father_id, mother_id, health_status, breeding_status, current_location, status) VALUES
      ('Daisy', 'QR-GOAT-005', 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=400&q=80', 'Boer', 'female', '2023-05-20', 52.0, 'White & Red Patch', 1, 2, 'Healthy', 'Pregnant', 'Maternity Pen 2', 'active')
    `);
    // ID 6: Stella (Daughter of Apollo & Luna)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, father_id, mother_id, health_status, breeding_status, current_location, status) VALUES
      ('Stella', 'QR-GOAT-006', 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80', 'Saanen', 'female', '2023-06-14', 49.5, 'White', 3, 4, 'Healthy', 'In Heat', 'Pen B (Does)', 'active')
    `);
    // ID 7: Thor (Alpine Buck)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, purchase_date, purchase_price, health_status, breeding_status, current_location, status) VALUES
      ('Thor', 'QR-GOAT-007', 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=400&q=80', 'Alpine', 'male', '2023-02-10', 74.0, 'Cou Blanc (Black & White)', '2023-09-01', 160000, 'Healthy', 'Active Breeder', 'Pen A (Bucks)', 'active')
    `);
    // ID 8: Chloe (Alpine Doe)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, purchase_date, purchase_price, health_status, breeding_status, current_location, status) VALUES
      ('Chloe', 'QR-GOAT-008', 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=400&q=80', 'Alpine', 'female', '2023-03-05', 51.0, 'Chamoisée (Brown & Black)', '2023-09-01', 110000, 'Healthy', 'Eligible', 'Pen B (Does)', 'active')
    `);
    // ID 9: Maya (Nubian Doe)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, purchase_date, purchase_price, health_status, breeding_status, current_location, status) VALUES
      ('Maya', 'QR-GOAT-009', 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=400&q=80', 'Nubian', 'female', '2023-04-18', 56.0, 'Spotted Black & Tan', '2023-11-10', 130000, 'Healthy', 'Pregnant', 'Maternity Pen 3', 'active')
    `);

    // Goats - Generation 3 (Kids born recently)
    // ID 10: Pip (Kid born from Titan & Daisy - wait, Daisy is Titan's daughter, let's make Pip from Thor & Daisy)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, father_id, mother_id, health_status, breeding_status, current_location, status) VALUES
      ('Pip', 'QR-GOAT-010', 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=400&q=80', 'Boer-Cross', 'male', '2026-08-10', 14.2, 'White with Brown Face', 7, 5, 'Healthy', 'Kid / Growing', 'Nursery Pen', 'active')
    `);
    // ID 11: Dot (Kid born from Thor & Daisy)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, father_id, mother_id, health_status, breeding_status, current_location, status) VALUES
      ('Dot', 'QR-GOAT-011', 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80', 'Boer-Cross', 'female', '2026-08-10', 12.8, 'Brown & White', 7, 5, 'Healthy', 'Kid / Growing', 'Nursery Pen', 'active')
    `);
    // ID 12: Barnaby (Kid born from Apollo & Bella)
    db.run(`INSERT INTO goats (name, qr_code_id, photo_url, breed, gender, dob, weight, color, father_id, mother_id, health_status, breeding_status, current_location, status) VALUES
      ('Barnaby', 'QR-GOAT-012', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80', 'Saanen-Boer', 'male', '2026-09-01', 11.5, 'White & Tan', 3, 2, 'Healthy', 'Kid / Growing', 'Nursery Pen', 'active')
    `);

    // 3. Heat Cycles
    db.run(`INSERT INTO heat_cycles (goat_id, heat_date, next_expected_heat, status, notes) VALUES
      (6, '2026-10-25', '2026-11-15', 'Active Heat', 'Strong standing heat observed at 08:00 AM.'),
      (8, '2026-10-10', '2026-10-31', 'Observed', 'Mild tail wagging and vocalization.'),
      (2, '2026-09-15', '2026-10-06', 'Passed', 'Normal cycle, rested per breeding schedule.')
    `);

    // 4. Breeding Records
    // Mating 1: Apollo + Luna (Pregnant)
    db.run(`INSERT INTO breeding_records (female_id, male_id, mating_date, method, status, notes) VALUES
      (4, 3, '2026-07-15', 'Natural', 'Successful', 'Confirmed pregnant via ultrasound on Aug 20.')
    `);
    // Mating 2: Thor + Daisy (Pregnant)
    db.run(`INSERT INTO breeding_records (female_id, male_id, mating_date, method, status, notes) VALUES
      (5, 7, '2026-08-01', 'Natural', 'Successful', 'Good physical condition, second parity.')
    `);
    // Mating 3: Titan + Maya (Pregnant)
    db.run(`INSERT INTO breeding_records (female_id, male_id, mating_date, method, status, notes) VALUES
      (9, 1, '2026-06-25', 'Natural', 'Successful', 'Expected delivery in late November.')
    `);
    // Mating 4: Apollo + Bella (Historical delivery in Sept)
    db.run(`INSERT INTO breeding_records (female_id, male_id, mating_date, method, status, notes) VALUES
      (2, 3, '2026-04-05', 'Natural', 'Completed Delivery', 'Delivered single buck kid (Barnaby).')
    `);

    // 5. Pregnancy Records
    // Luna pregnancy (Mating July 15 -> Delivery Dec 12)
    db.run(`INSERT INTO pregnancy_records (breeding_id, goat_id, confirmation_date, expected_delivery_date, status, health_status, notes) VALUES
      (1, 4, '2026-08-20', '2026-12-12', 'Pregnant', 'Excellent', 'Ultrasound shows twins. Weight gain steady.')
    `);
    // Daisy pregnancy (Mating Aug 1 -> Delivery Dec 29)
    db.run(`INSERT INTO pregnancy_records (breeding_id, goat_id, confirmation_date, expected_delivery_date, status, health_status, notes) VALUES
      (2, 5, '2026-09-10', '2026-12-29', 'Pregnant', 'Good', 'Adjusted feed with high-protein alfalfa.')
    `);
    // Maya pregnancy (Mating June 25 -> Delivery Nov 22)
    db.run(`INSERT INTO pregnancy_records (breeding_id, goat_id, confirmation_date, expected_delivery_date, status, health_status, notes) VALUES
      (3, 9, '2026-08-02', '2026-11-22', 'Pregnant', 'Good', 'Due in 20 days. Maternity pen prepped.')
    `);

    // 6. Deliveries (Historical)
    db.run(`INSERT INTO deliveries (pregnancy_id, mother_id, father_id, delivery_date, num_kids, male_kids, female_kids, delivery_type, mother_health, kids_health, notes) VALUES
      (NULL, 5, 7, '2026-08-10', 2, 1, 1, 'Normal', 'Good', 'Healthy Twins', 'Birthed Pip and Dot. Smooth delivery.'),
      (4, 2, 3, '2026-09-01', 1, 1, 0, 'Normal', 'Excellent', 'Healthy Single', 'Birthed Barnaby. Mother recovered well.')
    `);

    // 7. Offspring Records
    db.run(`INSERT INTO offspring (delivery_id, goat_id, birth_weight, current_weight, weaning_date, sale_status, breeding_eligible) VALUES
      (1, 10, 3.2, 14.2, '2026-10-10', 'Available', 1),
      (1, 11, 2.9, 12.8, '2026-10-10', 'Retained for Farm', 1),
      (2, 12, 3.5, 11.5, NULL, 'Available', 1)
    `);

    // 8. Health Records
    db.run(`INSERT INTO health_records (goat_id, type, disease, symptoms, diagnosis, treatment, medicines, dosage, vet_name, date, next_checkup_date, notes) VALUES
      (4, 'Routine Checkup', 'None', 'Normal gestation', 'Healthy Pregnancy', 'Prenatal Vitamin Supplement', 'GoatVite Powder', '10g daily', 'Dr. Aris Miller', '2026-10-15', '2026-11-15', 'Heartbeat clear for twin kids.'),
      (1, 'Hoof Trimming', 'Overgrown Hooves', 'Slight limp on front left', 'Hoof Overgrowth', 'Trimming & Copper Sulfate Bath', 'Copper Sulfate 5%', 'Topical', 'Dr. Aris Miller', '2026-10-02', '2026-12-02', 'Hooves shaped, limp resolved.'),
      (10, 'Dehorning / Disbudding', 'N/A', 'Horn Buds Present', 'Disbudding Procedure', 'Thermal Cautery & Painkiller', 'Meloxicam', '0.5mg/kg', 'Dr. Aris Miller', '2026-08-20', NULL, 'Successful disbudding without complication.')
    `);

    // 9. Vaccinations
    db.run(`INSERT INTO vaccinations (goat_id, name, date, next_due_date, status, administered_by, notes) VALUES
      (4, 'CDT Booster (Clostridium & Tetanus)', '2026-10-01', '2027-10-01', 'Completed', 'Sarah Jenkins', 'Pre-kidding vaccination for colostrum antibodies.'),
      (5, 'CDT Booster', '2026-10-01', '2027-10-01', 'Completed', 'Sarah Jenkins', 'Pre-kidding vaccination.'),
      (1, 'Rabies Vaccine', '2026-05-10', '2027-05-10', 'Completed', 'Dr. Aris Miller', 'Annual farm herd rabies vaccination.'),
      (10, 'CDT Primary Shot', '2026-09-10', '2026-10-10', 'Completed', 'Mike Vance', 'First kid shot at 4 weeks.'),
      (11, 'CDT Primary Shot', '2026-09-10', '2026-10-10', 'Completed', 'Mike Vance', 'First kid shot at 4 weeks.'),
      (6, 'CDT Annual Booster', '2025-11-15', '2026-11-15', 'Scheduled', 'Pending', 'Due in 13 days.')
    `);

    // 10. Feed Inventory & Feeding Records
    db.run(`INSERT INTO feed_inventory (name, category, stock_kg, min_stock_kg, unit_cost, supplier) VALUES
      ('Alfalfa Hay Bales', 'Forage', 450.0, 100.0, 60, 'Valley Green Feed Co.'),
      ('Grain Breeding Feed (16% Protein)', 'Concentrate', 180.0, 50.0, 130, 'AgriSupply Ltd.'),
      ('Mineral Blocks with Selenium', 'Minerals', 12.0, 5.0, 450, 'AgriSupply Ltd.'),
      ('Milk Replacer Powder', 'Kid Feed', 25.0, 10.0, 1800, 'PureDairy Feeds')
    `);

    db.run(`INSERT INTO feeding_records (feed_id, goat_id, group_name, feed_type, amount_kg, cost, date, notes) VALUES
      (1, NULL, 'Maternity Group (Pregnant Does)', 'Alfalfa Hay Bales', 15.0, 900, '2026-11-01', 'Daily morning forage allotment.'),
      (2, NULL, 'Maternity Group (Pregnant Does)', 'Grain Breeding Feed', 6.0, 780, '2026-11-01', 'High energy ration for late gestation.'),
      (1, NULL, 'Buck Pen A', 'Alfalfa Hay Bales', 10.0, 600, '2026-11-01', 'Standard buck maintenance feed.')
    `);

    // 11. Financial Transactions
    db.run(`INSERT INTO financials (type, category, amount, date, description, goat_id, reference_no) VALUES
      ('income', 'Goat Sales', 55000, '2026-10-12', 'Sold wether kid to Green Valley Ranch', NULL, 'INV-2026-088'),
      ('income', 'Milk Sales', 70000, '2026-10-28', 'Monthly batch sale of goat milk to Artisan Creamery', NULL, 'INV-2026-092'),
      ('income', 'Breeding Services', 25000, '2026-09-15', 'Stud service fee for Titan (Buck #1)', 1, 'INV-2026-074'),
      ('expense', 'Feed', 85000, '2026-10-05', 'Purchased 20 bales Alfalfa & 5 bags grain mix', NULL, 'EXP-2026-140'),
      ('expense', 'Veterinary Services', 18000, '2026-10-15', 'Routine herd visit & ultrasound scans by Dr. Miller', NULL, 'EXP-2026-145'),
      ('expense', 'Vaccination', 9500, '2026-10-01', 'CDT vaccines and syringes restock', NULL, 'EXP-2026-132'),
      ('expense', 'Farm Maintenance', 35000, '2026-10-20', 'Repaired fencing around Pen B', NULL, 'EXP-2026-149')
    `);

    // 12. Calendar Events
    db.run(`INSERT INTO calendar_events (goat_id, title, event_type, event_date, description, status) VALUES
      (9, 'Expected Delivery - Maya', 'Expected Delivery', '2026-11-22', 'Due date for Maya x Titan offspring.', 'Scheduled'),
      (4, 'Expected Delivery - Luna', 'Expected Delivery', '2026-12-12', 'Due date for Luna x Apollo twins.', 'Scheduled'),
      (5, 'Expected Delivery - Daisy', 'Expected Delivery', '2026-12-29', 'Due date for Daisy x Thor.', 'Scheduled'),
      (6, 'Expected Heat Cycle - Stella', 'Heat Cycle', '2026-11-15', 'Watch for standing heat signs.', 'Scheduled'),
      (6, 'CDT Booster - Stella', 'Vaccination', '2026-11-15', 'Annual booster shot.', 'Scheduled'),
      (4, 'Pre-Kidding Vet Scan - Luna', 'Veterinary Checkup', '2026-11-25', 'Check twin positioning and fetal heartbeats.', 'Scheduled')
    `);

    // 13. Farm Settings
    db.run(`INSERT INTO farm_settings (key, value) VALUES
      ('gestation_days', '150'),
      ('heat_cycle_days', '21'),
      ('max_inbreeding_generations', '3'),
      ('notification_email', 'alerts@goatfarm.com'),
      ('farm_name', 'Highland Crest Goat Farm & Breeding Station')
    `);
  });

  console.log('Database seeded successfully with 12 goats and full farm history!');
}

module.exports = { seedDatabase };
