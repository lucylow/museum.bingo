import ARKit
import Foundation
import SceneKit
import UIKit

@objc(ARConfettiModule)
class ARConfettiModule: NSObject, RCTBridgeModule, ARSCNViewDelegate {
  static func moduleName() -> String! {
    return "ARConfettiModule"
  }

  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  private var arView: ARSCNView?
  private var particleSystem: SCNParticleSystem?
  private var particleNode: SCNNode?

  @objc(startConfettiWithPlaneDetection:)
  func startConfettiWithPlaneDetection(_ callback: @escaping RCTResponseSenderBlock) {
    DispatchQueue.main.async {
      guard ARWorldTrackingConfiguration.isSupported else {
        callback([false, "ARKit is not supported on this device"])
        return
      }

      guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
            let window = windowScene.windows.first,
            let rootView = window.rootViewController?.view else {
        callback([false, "No root view found"])
        return
      }

      let arView = ARSCNView(frame: rootView.bounds)
      arView.scene = SCNScene()
      arView.automaticallyUpdatesLighting = true
      arView.delegate = self
      rootView.addSubview(arView)
      self.arView = arView

      let config = ARWorldTrackingConfiguration()
      config.planeDetection = [.horizontal]
      arView.session.run(config, options: [.removeExistingAnchors, .resetTracking])

      self.setupConfettiParticles()
      callback([true, "Confetti started"])
    }
  }

  @objc(startConfetti:)
  func startConfetti(_ callback: @escaping RCTResponseSenderBlock) {
    startConfettiWithPlaneDetection(callback)
  }

  private func setupConfettiParticles() {
    guard let scene = arView?.scene else { return }

    if let named = SCNParticleSystem(named: "Confetti.scnp", inDirectory: nil) {
      particleSystem = named
    } else {
      let fallback = SCNParticleSystem()
      fallback.birthRate = 700
      fallback.particleLifeSpan = 2.4
      fallback.particleLifeSpanVariation = 0.5
      fallback.emissionDuration = 1.2
      fallback.spreadingAngle = 50
      fallback.particleVelocity = 3
      fallback.particleVelocityVariation = 1.5
      fallback.acceleration = SCNVector3(0, -5.5, 0)
      fallback.particleColor = UIColor.systemYellow
      fallback.particleColorVariation = SCNVector4(0.4, 0.2, 0.8, 0)
      fallback.particleSize = 0.02
      fallback.particleSizeVariation = 0.01
      particleSystem = fallback
    }

    let node = SCNNode()
    node.position = SCNVector3(0, 0.2, -0.4)
    if let ps = particleSystem {
      node.addParticleSystem(ps)
    }
    scene.rootNode.addChildNode(node)
    particleNode = node
  }

  @objc(stopConfetti)
  func stopConfetti() {
    DispatchQueue.main.async {
      self.particleSystem?.birthRate = 0
      self.particleNode?.removeFromParentNode()
      self.particleNode = nil
      self.particleSystem = nil
      self.arView?.session.pause()
      self.arView?.removeFromSuperview()
      self.arView = nil
    }
  }

  func renderer(_ renderer: SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
    guard let planeAnchor = anchor as? ARPlaneAnchor else { return }
    let plane = SCNPlane(width: CGFloat(planeAnchor.extent.x), height: CGFloat(planeAnchor.extent.z))
    plane.firstMaterial?.diffuse.contents = UIColor.green.withAlphaComponent(0.18)
    let planeNode = SCNNode(geometry: plane)
    planeNode.eulerAngles.x = -.pi / 2
    planeNode.position = SCNVector3(planeAnchor.center.x, 0, planeAnchor.center.z)
    node.addChildNode(planeNode)
  }
}
