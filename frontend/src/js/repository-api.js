// Repository Tree API Endpoints for Backend Integration
// This file contains the API endpoints to support the repository tree functionality

// Repository Tree API Endpoints
const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/rest');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize Octokit for GitHub API
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

// Repository Tree API Endpoints
router.get('/api/repository/:owner/:repo/contents', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { path = '' } = req.query;
        
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/api/repository/:owner/:repo/contents/:path(*)', async (req, res) => {
    try {
        const { owner, repo, path } = req.params;
        
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/api/repository/:owner/:repo/tree', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { path = '' } = req.query;
        
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/api/repository/:owner/:repo/branches', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        
        const response = await octokit.repos.listBranches({
            owner,
            repo
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/api/repository/:owner/:repo/branches/:branch', async (req, res) => {
    try {
        const { owner, repo, branch } = req.params;
        
        const response = await octokit.repos.listBranches({
            owner,
            repo
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/api/repository/:owner/:repo/releases', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        
        const response = await octokit.repos.listReleases({
            owner,
            repo
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/api/repository/:owner/:repo/releases/:release_id', async (req, res) => {
    try {
                const { owner, repo, release_id } = req.params;
        
                const response = await octokit.repos.listReleases({
                    owner,
                    repo
                });
        
                return res.json(response.data);
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
        });

router.get('/api/repository/:owner/:repo/releases/:release_id/assets', async (req, res) => {
    try {
        const { owner, repo, release_id } = req.params;
        
        const response = await octokit.repos.listReleases({
            owner,
            repo
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
            }
        });

router.get('/api/repository/:owner/:repo/releases/:release_id/assets/:asset_id', async (req, res) => {
    try {
        const { owner, repo, release_id } = req.params;
        
        const response = await octokit.repos.listReleases({
            owner,
            repo
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
            }
        });

router.get('/api/repository/:owner/:repo/releases/:release_id/assets/:asset_id/download', async (req, res) => {
    try {
        const { owner, repo, release_id } = req.params;
        
        const response = await octokit.repos.listReleases({
            owner,
            repo
        });
        
        return res.json(response.data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
            }
        });

// Export the router
module.exports = router;
