import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {

  private let store = ManagedSettingsStore()
  private let center = AuthorizationCenter.shared

  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        try await center.requestAuthorization(for: .individual)
        resolve(true)
      } catch {
        reject("AUTH_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc
  func blockApps(_ bundleIds: [String],
                 resolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    // In production, ApplicationTokens are obtained via FamilyActivityPicker UI,
    // not directly from bundle IDs. This demonstrates the ManagedSettings pattern.
    // As a fallback, shield by category.
    let applications = Set<ApplicationToken>()

    store.shield.applications = applications.isEmpty ? nil : applications

    if !bundleIds.isEmpty {
      // Shield social media and entertainment categories
      store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(
        [.socialNetworking, .entertainment],
        except: Set()
      )
    }

    resolve(true)
  }

  @objc
  func unblockApps(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomainCategories = nil
    resolve(true)
  }

  @objc
  func blockAllSocialMedia(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(
      [.socialNetworking, .entertainment, .games],
      except: Set()
    )
    resolve(true)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { return false }

  @objc
  static func moduleName() -> String! { return "ScreenTimeModule" }
}
