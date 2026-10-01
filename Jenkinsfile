
// =============================================================================
// Jenkinsfile - React/Vite Frontend CI/CD Pipeline
// =============================================================================
// Flow:
//
// GitHub dev branch
//       |
//       v
// Jenkins
//       |
//       +--> npm install
//       |
//       +--> npm run build
//       |
//       +--> Docker build
//       |
//       +--> AWS ECR login
//       |
//       +--> Docker push
//       |
//       +--> EC2 #1 -> pull latest frontend -> restart frontend
//       |
//       +--> EC2 #2 -> pull latest frontend -> restart frontend
//       |
//       +--> Verify both frontend containers
//
// Jenkins is running on Windows, therefore this Jenkinsfile uses BAT commands.
//
// Backend containers on EC2 are NOT stopped or modified.
// =============================================================================

pipeline {

    agent any

    // -------------------------------------------------------------------------
    // Poll GitHub every minute
    // -------------------------------------------------------------------------
    triggers {
        pollSCM('* * * * *')
    }

    // -------------------------------------------------------------------------
    // Node.js configured in:
    // Manage Jenkins
    // -> Tools
    // -> NodeJS installations
    //
    // Make sure the name is exactly: NodeJS-20
    // -------------------------------------------------------------------------
    tools {
        nodejs 'NodeJS-20'
    }

    // -------------------------------------------------------------------------
    // Environment configuration
    // -------------------------------------------------------------------------
    environment {

        // AWS
        AWS_REGION = 'us-east-1'

        // ECR
        ECR_REGISTRY = '888577028066.dkr.ecr.us-east-1.amazonaws.com'
        ECR_REPO_NAME = 'vaishnavitestrepo'

        ECR_REPO = "${ECR_REGISTRY}/${ECR_REPO_NAME}"

        // We are using the existing ECR tag "frontend"
        IMAGE_TAG = 'frontend'

        FULL_IMAGE = "${ECR_REPO}:${IMAGE_TAG}"

        // ---------------------------------------------------------------------
        // EC2 #1
        // ---------------------------------------------------------------------
        EC2_1_HOST = 'ec2-54-87-12-147.compute-1.amazonaws.com'
        EC2_1_USER = 'ec2-user'

        // ---------------------------------------------------------------------
        // EC2 #2
        // ---------------------------------------------------------------------
        EC2_2_HOST = 'ec2-52-91-159-239.compute-1.amazonaws.com'
        EC2_2_USER = 'ec2-user'

        // ---------------------------------------------------------------------
        // Jenkins credential IDs
        //
        // AWS credential:
        // Jenkins -> Credentials
        // ID = aws-ecr-credentials
        // Kind = AWS Credentials
        //
        // SSH credential:
        // ID = ec2-ssh-key
        // Kind = SSH Username with private key
        // ---------------------------------------------------------------------
        AWS_CREDENTIALS_ID = 'aws-ecr-credentials'
        EC2_SSH_CREDENTIALS_ID = 'ec2-ssh-key'
    }


    stages {

        // =====================================================================
        // STAGE 1 - CHECKOUT
        // =====================================================================

        stage('Checkout') {

            steps {

                echo 'Checking out dev branch from GitHub...'

                git(
                    branch: 'dev',
                    url: 'https://github.com/Vaishnavi-Shetti/s3frontend.git'
                )
            }
        }


        // =====================================================================
        // STAGE 2 - BUILD REACT APPLICATION
        // =====================================================================

        stage('Build React Application') {

            steps {

                echo 'Installing npm dependencies...'

                bat 'npm install'

                echo 'Building React/Vite application...'

                bat 'npm run build'
            }
        }


        // =====================================================================
        // STAGE 3 - BUILD DOCKER IMAGE
        // =====================================================================

        stage('Build Docker Image') {

            steps {

                echo "Building Docker image: ${FULL_IMAGE}"

                bat "docker build -t ${FULL_IMAGE} ."
            }
        }


        // =====================================================================
        // STAGE 4 - LOGIN TO ECR AND PUSH IMAGE
        // =====================================================================

        stage('Push Image to ECR') {

            steps {

                echo "Logging into AWS ECR and pushing ${FULL_IMAGE}..."

                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: env.AWS_CREDENTIALS_ID
                    ]
                ]) {

                    bat """
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        docker push ${FULL_IMAGE}
                    """
                }
            }
        }


        // =====================================================================
        // STAGE 5 - DEPLOY TO EC2 #1
        // =====================================================================

        stage('Deploy to EC2 #1') {

            steps {

                script {

                    deployFrontendToEc2(
                        env.EC2_1_HOST,
                        env.EC2_1_USER
                    )
                }
            }
        }


        // =====================================================================
        // STAGE 6 - DEPLOY TO EC2 #2
        // =====================================================================

        stage('Deploy to EC2 #2') {

            steps {

                script {

                    deployFrontendToEc2(
                        env.EC2_2_HOST,
                        env.EC2_2_USER
                    )
                }
            }
        }


        // =====================================================================
        // STAGE 7 - VERIFY EC2 #1
        // =====================================================================

        stage('Verify EC2 #1') {

            steps {

                script {

                    verifyFrontendRunning(
                        env.EC2_1_HOST,
                        env.EC2_1_USER
                    )
                }
            }
        }


        // =====================================================================
        // STAGE 8 - VERIFY EC2 #2
        // =====================================================================

        stage('Verify EC2 #2') {

            steps {

                script {

                    verifyFrontendRunning(
                        env.EC2_2_HOST,
                        env.EC2_2_USER
                    )
                }
            }
        }
    }


    // =========================================================================
    // POST ACTIONS
    // =========================================================================

    post {

        success {

            echo """
            ============================================================
            FRONTEND CI/CD SUCCESSFUL
            ============================================================

            Image:
            ${FULL_IMAGE}

            The image was:
            1. Built
            2. Pushed to ECR
            3. Deployed to EC2 #1
            4. Deployed to EC2 #2
            5. Verified on both EC2 instances

            Backend containers were NOT modified.
            ============================================================
            """
        }

        failure {

            echo """
            ============================================================
            FRONTEND CI/CD FAILED
            ============================================================

            Check the failed stage above.
            ============================================================
            """
        }

        always {

            cleanWs()
        }
    }
}


// =============================================================================
// HELPER FUNCTION
// Deploy frontend to an EC2 instance
// =============================================================================
//
// IMPORTANT:
//
// We do NOT put the AWS Access Key ID or Secret Access Key into the EC2
// command.
//
// Jenkins already has the AWS credentials.
//
// Jenkins gets an ECR authentication password and sends that password through
// SSH to Docker on the EC2 instance.
//
// Therefore the EC2 does not need the AWS access key stored in app.env.
//
// =============================================================================

void deployFrontendToEc2(String host, String user) {

    withCredentials([
        sshUserPrivateKey(
            credentialsId: env.EC2_SSH_CREDENTIALS_ID,
            keyFileVariable: 'SSH_KEY'
        ),

        [
            $class: 'AmazonWebServicesCredentialsBinding',
            credentialsId: env.AWS_CREDENTIALS_ID
        ]
    ]) {

        echo "Deploying frontend to ${user}@${host}..."


        // ---------------------------------------------------------------------
        // Get ECR password on Jenkins and send it through SSH to the EC2.
        //
        // The EC2 then:
        //
        // 1. logs Docker into ECR
        // 2. pulls latest frontend image
        // 3. stops old frontend
        // 4. removes old frontend
        // 5. starts new frontend
        //
        // Backend is NOT touched.
        // ---------------------------------------------------------------------

        bat """
            aws ecr get-login-password --region ${AWS_REGION} | ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" ${user}@${host} "docker login --username AWS --password-stdin ${ECR_REGISTRY}"

            ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" ${user}@${host} "docker pull ${FULL_IMAGE}"

            ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" ${user}@${host} "docker stop frontend || true"

            ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" ${user}@${host} "docker rm frontend || true"

            ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" ${user}@${host} "docker run -d --name frontend --network app-network -p 80:80 --restart unless-stopped ${FULL_IMAGE}"
        """
    }
}


// =============================================================================
// HELPER FUNCTION
// Verify frontend container is running
// =============================================================================

void verifyFrontendRunning(String host, String user) {

    withCredentials([
        sshUserPrivateKey(
            credentialsId: env.EC2_SSH_CREDENTIALS_ID,
            keyFileVariable: 'SSH_KEY'
        )
    ]) {

        echo "Checking frontend container on ${host}..."


        bat """
            ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" ${user}@${host} "docker ps --filter name=frontend --filter status=running --format '{{.Names}}' > frontend_status.txt"
        """

        // ---------------------------------------------------------------------
        // Instead of depending on a local file generated by the remote shell,
        // perform a simple docker health check remotely.
        // ---------------------------------------------------------------------

        bat """
            ssh -o StrictHostKeyChecking=no -i "%SSH_KEY%" ${user}@${host} "docker inspect -f '{{.State.Running}}' frontend"
        """
    }
}
