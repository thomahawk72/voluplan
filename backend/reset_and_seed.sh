#!/bin/bash

# ============================================
# Reset database og last inn CURRENT DATA
# ============================================

set -e  # Exit on error

# Farger for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}  Voluplan Database Reset & Seed${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

# Last inn .env for database-tilkobling
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo -e "${RED}❌ Finner ikke .env-fil!${NC}"
  exit 1
fi

# Bygg connection string
DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo -e "${YELLOW}🗑️  Sletter all data...${NC}"
psql "$DB_URL" -f reset_database.sql > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Data slettet${NC}"
else
  echo -e "${RED}❌ Feil ved sletting av data${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}📦 Laster inn testdata...${NC}"
psql "$DB_URL" -f seed_data.sql > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Testdata lastet inn${NC}"
else
  echo -e "${RED}❌ Feil ved lasting av testdata${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✅ Database reset og seed fullført!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "🔑 Innlogging:"
echo "  Email: test@example.com"
echo "  Passord: passord123"
echo ""
echo "📊 Data lastet inn:"
echo "  - 5 brukere (alle passord: passord123)"
echo "  - Talent-hierarki (dagens struktur)"
echo "  - Bruker-talents"
echo "  - INGEN produksjoner"
echo "  - INGEN produksjonskategorier"
echo ""
echo "💡 Dette er dagens data fra databasen"
echo ""

