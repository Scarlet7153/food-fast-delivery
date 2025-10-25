#!/bin/bash

# 🚀 Setup Branch Strategy cho CI/CD Pipeline
# Script này sẽ giúp bạn setup branch strategy từ branch main hiện tại

echo "🌿 Setting up Branch Strategy for CI/CD Pipeline..."
echo "=================================================="

# Kiểm tra xem có đang ở branch main không
current_branch=$(git branch --show-current)
echo "📍 Current branch: $current_branch"

if [ "$current_branch" != "main" ]; then
    echo "⚠️  Warning: You're not on main branch. Switching to main..."
    git checkout main
fi

# Pull latest changes
echo "📥 Pulling latest changes from main..."
git pull origin main

# Tạo branch develop từ main
echo "🌿 Creating develop branch from main..."
git checkout -b develop

# Push branch develop lên GitHub
echo "📤 Pushing develop branch to GitHub..."
git push origin develop

# Tạo branch develop tracking
echo "🔗 Setting up tracking for develop branch..."
git branch --set-upstream-to=origin/develop develop

# Tạo feature branch test
echo "🧪 Creating test feature branch..."
git checkout -b feature/test-ci-cd

# Tạo file test
echo "📝 Creating test file..."
echo "# Test CI/CD Pipeline" > TEST_CI_CD.md
echo "This file is created to test the CI/CD pipeline." >> TEST_CI_CD.md
echo "Date: $(date)" >> TEST_CI_CD.md

# Commit và push
echo "💾 Committing test changes..."
git add TEST_CI_CD.md
git commit -m "test: add test file for CI/CD pipeline"

echo "📤 Pushing test feature branch..."
git push origin feature/test-ci-cd

# Quay lại develop
git checkout develop

echo ""
echo "✅ Branch setup completed!"
echo "=================================================="
echo "📋 What was created:"
echo "   - ✅ develop branch (from main)"
echo "   - ✅ feature/test-ci-cd branch (for testing)"
echo "   - ✅ TEST_CI_CD.md file"
echo ""
echo "🔧 Next steps:"
echo "   1. Go to GitHub repository"
echo "   2. Create Pull Request: feature/test-ci-cd → develop"
echo "   3. Configure branch protection rules"
echo "   4. Add GitHub secrets"
echo "   5. Create environments (staging, production)"
echo ""
echo "📚 Read SETUP_BRANCH_STRATEGY.md for detailed instructions"
echo ""
echo "🎉 Happy coding!"
